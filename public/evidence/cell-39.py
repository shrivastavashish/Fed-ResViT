def clone_state_dict(state_dict):
    """Detach a state dict and move it to CPU."""
    return {k: v.detach().cpu().clone() for k, v in state_dict.items()}


def is_float_tensor(t):
    return torch.is_tensor(t) and torch.is_floating_point(t)


def subtract_state_dict(local_state, base_state):
    """Return local_state - base_state for floating tensors."""
    delta = {}
    for k in base_state.keys():
        if is_float_tensor(base_state[k]):
            delta[k] = local_state[k].float() - base_state[k].float()
        else:
            delta[k] = base_state[k].clone()
    return delta


def add_delta_to_state(base_state, delta_state):
    """Return base_state + delta_state for floating tensors."""
    out = {}
    for k in base_state.keys():
        if is_float_tensor(base_state[k]):
            out[k] = (base_state[k].float() + delta_state[k].float()).to(dtype=base_state[k].dtype)
        else:
            out[k] = base_state[k].clone()
    return out


def aggregate_weighted_average(states, weights):
    """Weighted average over state dicts or delta dicts."""
    weights = np.asarray(weights, dtype=np.float64)
    total_w = float(np.sum(weights))
    if total_w <= 1e-12:
        weights = np.ones(len(states), dtype=np.float64)
        total_w = float(np.sum(weights))

    out = {}
    for k in states[0].keys():
        first = states[0][k]
        if is_float_tensor(first):
            acc = torch.zeros_like(first, dtype=torch.float32)
            for state, w in zip(states, weights):
                acc += state[k].float() * float(w)
            out[k] = (acc / total_w).to(dtype=first.dtype)
        else:
            out[k] = first.clone()
    return out


# ---------------------------------------------------------------------------
# FedAvg (Manuscript ref [9])
# ---------------------------------------------------------------------------
def aggregate_fedavg_delta(client_deltas, client_sizes):
    return aggregate_weighted_average(client_deltas, np.asarray(client_sizes, dtype=np.float64))


# ---------------------------------------------------------------------------
# Krum (Manuscript ref [10])
# ---------------------------------------------------------------------------
def state_distance_sq(a, b, normalize=False):
    """Squared L2 distance between two state/delta dictionaries.
    normalize=False keeps the raw L2 norm (matches manuscript Sec 4.5)."""
    total = 0.0
    for k in a.keys():
        if is_float_tensor(a[k]):
            diff = a[k].float() - b[k].float()
            total += float(torch.sum(diff * diff).item())
    return total


def aggregate_krum_delta(client_deltas, f=0):
    """Krum: select the single client update whose sum of distances to its
    m = n - f - 2 nearest neighbours is smallest."""
    n = len(client_deltas)
    if n <= 2:
        return clone_state_dict(client_deltas[0])

    f = int(max(0, min(f, n - 2)))
    m = max(1, n - f - 2)

    distances = np.zeros((n, n), dtype=np.float64)
    for i in range(n):
        for j in range(i + 1, n):
            d = state_distance_sq(client_deltas[i], client_deltas[j], normalize=False)
            distances[i, j] = d
            distances[j, i] = d

    scores = []
    for i in range(n):
        nearest = np.sort(distances[i][distances[i] > 0])[:m]
        scores.append(nearest.sum() if len(nearest) > 0 else 0.0)

    selected = int(np.argmin(scores))
    return clone_state_dict(client_deltas[selected])


# ---------------------------------------------------------------------------
# Coordinate-wise trimmed mean (Manuscript ref [11])
# ---------------------------------------------------------------------------
def aggregate_trimmed_mean_delta(client_deltas, trim_ratio=0.2):
    n = len(client_deltas)
    trim_k = int(math.floor(trim_ratio * n))
    if 2 * trim_k >= n:
        trim_k = max(0, (n - 1) // 2)

    out = {}
    for k in client_deltas[0].keys():
        first = client_deltas[0][k]
        if is_float_tensor(first):
            stacked = torch.stack([s[k].float() for s in client_deltas], dim=0)
            sorted_vals, _ = torch.sort(stacked, dim=0)
            trimmed = sorted_vals[trim_k:n - trim_k] if trim_k > 0 else sorted_vals
            out[k] = trimmed.mean(dim=0).to(dtype=first.dtype)
        else:
            out[k] = first.clone()
    return out


# ---------------------------------------------------------------------------
# Geometric median via Weiszfeld iteration (Manuscript Sec 4.5)
# ---------------------------------------------------------------------------
def aggregate_geometric_median(client_deltas, max_iters=10, eps=1e-6):
    """Geometric median over client deltas via Weiszfeld's algorithm.

    Returns a state-delta dict approximating
        argmin_x  sum_i || x - d_i ||_2

    We initialise from the coordinate-wise mean (a robust-ish start),
    then iterate:
        x_{t+1} = sum_i (d_i / ||d_i - x_t||) / sum_i (1 / ||d_i - x_t||)
    and stop after `max_iters` or when the relative change is below `eps`.
    """
    n = len(client_deltas)
    if n == 0:
        raise ValueError("Cannot take geometric median of zero deltas.")
    if n == 1:
        return clone_state_dict(client_deltas[0])

    # Initialise x_0 = coordinate-wise mean.
    x = aggregate_weighted_average(client_deltas, np.ones(n, dtype=np.float64))

    float_keys = [k for k in x.keys() if is_float_tensor(x[k])]

    def l2_dist(d1, d2):
        total = 0.0
        for k in float_keys:
            diff = d1[k].float() - d2[k].float()
            total += float(torch.sum(diff * diff).item())
        return math.sqrt(max(total, 0.0))

    for it in range(max_iters):
        # Compute weights 1 / ||d_i - x_t|| (with eps floor).
        ws = np.zeros(n, dtype=np.float64)
        for i in range(n):
            d = l2_dist(client_deltas[i], x)
            ws[i] = 1.0 / max(d, eps)

        if ws.sum() <= 0:
            break

        x_new = {}
        for k in x.keys():
            if not is_float_tensor(x[k]):
                x_new[k] = x[k].clone()
                continue
            acc = torch.zeros_like(x[k], dtype=torch.float32)
            for i in range(n):
                acc += client_deltas[i][k].float() * float(ws[i])
            x_new[k] = (acc / float(ws.sum())).to(dtype=x[k].dtype)

        # Check convergence.
        change = l2_dist(x_new, x)
        x = x_new
        if change < eps:
            break

    return x



# ---------------------------------------------------------------------------
# Trust-aware aggregator -- memory-safe + numerically stable distance option.
# ---------------------------------------------------------------------------
class TrustAwareAggregator:
    """Trust-aware aggregation.

    Two practical improvements are included:

    1) TRUST_DISTANCE_MODE="rms" computes L2/sqrt(parameter_count). Raw L2 over
       millions of parameters is often too large for fixed thresholds and may
       drive every phi to zero.

    2) TRUST_ADAPTIVE_THRESHOLDS=True uses median/MAD-based thresholds per round.
       This prevents the all-zero-trust collapse in small Colab runs. Disable it
       if you need the exact fixed-threshold manuscript version.
    """

    def __init__(
        self,
        num_clients,
        t_low,
        t_high,
        momentum=0.85,
        flag_phi_threshold=0.5,
        flag_rounds=5,
        geom_median_iters=10,
        distance_mode="rms",
        adaptive_thresholds=True,
        mad_low_mult=0.5,
        mad_high_mult=3.0,
    ):
        self.num_clients = int(num_clients)
        self.t_low = float(t_low)
        self.t_high = float(t_high)
        self.momentum = float(momentum)
        self.flag_phi_threshold = float(flag_phi_threshold)
        self.flag_rounds = int(flag_rounds)
        self.geom_median_iters = int(geom_median_iters)
        self.distance_mode = str(distance_mode).lower()
        self.adaptive_thresholds = bool(adaptive_thresholds)
        self.mad_low_mult = float(mad_low_mult)
        self.mad_high_mult = float(mad_high_mult)

        if self.t_high <= self.t_low:
            raise ValueError("T_high must be > T_low.")
        if self.distance_mode not in {"l2", "rms"}:
            raise ValueError("distance_mode must be 'l2' or 'rms'.")

        self.reputation = np.ones(self.num_clients, dtype=np.float64)
        self.phi_history = defaultdict(list)
        self.rounds_seen = 0

    @staticmethod
    def _phi(delta, t_low, t_high):
        if delta <= t_low:
            return 1.0
        if delta >= t_high:
            return 0.0
        return float((t_high - delta) / max(t_high - t_low, 1e-12))

    def _distance(self, a, b):
        total = 0.0
        n_params = 0
        for k in a.keys():
            if is_float_tensor(a[k]):
                diff = a[k].float() - b[k].float()
                total += float(torch.sum(diff * diff).item())
                n_params += diff.numel()
        dist = math.sqrt(max(total, 0.0))
        if self.distance_mode == "rms":
            dist = dist / math.sqrt(max(n_params, 1))
        return dist

    def _round_thresholds(self, distances):
        if not self.adaptive_thresholds or len(distances) < 3:
            return self.t_low, self.t_high

        distances = np.asarray(distances, dtype=np.float64)
        med = float(np.median(distances))
        mad = float(np.median(np.abs(distances - med)))

        # If MAD collapses to zero, fall back to an IQR/percentile scale.
        if mad <= 1e-12:
            q25, q75 = np.percentile(distances, [25, 75])
            spread = float(max(q75 - q25, np.std(distances), 1e-12))
        else:
            spread = 1.4826 * mad  # robust sigma estimate

        t_low = med + self.mad_low_mult * spread
        t_high = med + self.mad_high_mult * spread
        if t_high <= t_low:
            t_high = t_low + max(abs(t_low) * 0.1, 1e-8)

        return float(t_low), float(t_high)

    def aggregate(self, client_deltas, client_sizes):
        w_ref = aggregate_geometric_median(
            client_deltas, max_iters=self.geom_median_iters
        )

        distances = np.zeros(len(client_deltas), dtype=np.float64)
        for i, d in enumerate(client_deltas):
            distances[i] = self._distance(d, w_ref)

        round_t_low, round_t_high = self._round_thresholds(distances)

        phi = np.zeros(len(client_deltas), dtype=np.float64)
        for i in range(len(client_deltas)):
            phi[i] = self._phi(distances[i], round_t_low, round_t_high)

        self.reputation = (
            self.momentum * self.reputation + (1.0 - self.momentum) * phi
        )
        self.rounds_seen += 1

        for i in range(len(client_deltas)):
            self.phi_history[i].append(phi[i])
            if len(self.phi_history[i]) > self.flag_rounds:
                self.phi_history[i].pop(0)

        flagged_now = np.zeros(len(client_deltas), dtype=bool)
        for i in range(len(client_deltas)):
            hist = self.phi_history[i]
            if hist and min(hist) < self.flag_phi_threshold:
                flagged_now[i] = True

        weights = self.reputation * phi

        if weights.sum() <= 1e-12:
            print("All trust weights are zero this round; falling back to FedAvg-delta.")
            weights = np.asarray(client_sizes, dtype=np.float64)

        aggregated_delta = aggregate_weighted_average(client_deltas, weights)

        info = {
            "distances": distances,
            "phi": phi,
            "reputation": self.reputation.copy(),
            "weights": weights.copy(),
            "flagged_now": flagged_now.copy(),
            "distance_mode": self.distance_mode,
            "round_t_low": round_t_low,
            "round_t_high": round_t_high,
            "w_ref_norm": float(np.linalg.norm(distances)),
        }
        return aggregated_delta, info
