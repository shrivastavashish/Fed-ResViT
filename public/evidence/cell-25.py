from PIL import ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

_IMAGENET_MEAN = [0.485, 0.456, 0.406]
_IMAGENET_STD = [0.229, 0.224, 0.225]

if CONFIG.get("USE_STRONG_AUG", False):
    # Stronger but still safe augmentation for HAM10000 fine-tuning.
    # RandomResizedCrop makes the model less dependent on exact lesion position;
    # RandAugment adds mild color/contrast/geometry variation.
    _train_aug = [
        transforms.RandomResizedCrop(
            CONFIG["IMG_SIZE"], scale=(0.75, 1.0), ratio=(0.90, 1.10)
        ),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degrees=20),
        transforms.ColorJitter(brightness=0.12, contrast=0.12, saturation=0.12, hue=0.02),
    ]
    try:
        _train_aug.append(transforms.RandAugment(num_ops=2, magnitude=7))
    except Exception:
        pass
else:
    _train_aug = [
        transforms.Resize((CONFIG["IMG_SIZE"], CONFIG["IMG_SIZE"])),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.08, contrast=0.08, saturation=0.08, hue=0.02),
    ]

_train_aug.extend([
    transforms.ToTensor(),
    transforms.Normalize(mean=_IMAGENET_MEAN, std=_IMAGENET_STD),
])

if CONFIG.get("USE_RANDOM_ERASING", False):
    _train_aug.append(transforms.RandomErasing(p=0.15, scale=(0.02, 0.08), ratio=(0.3, 3.3)))

train_tfms = transforms.Compose(_train_aug)

eval_tfms = transforms.Compose([
    transforms.Resize((CONFIG["IMG_SIZE"], CONFIG["IMG_SIZE"])),
    transforms.ToTensor(),
    transforms.Normalize(mean=_IMAGENET_MEAN, std=_IMAGENET_STD),
])


class HAM10000Dataset(Dataset):
    """Lightweight dataset.

    Improvement over dataframe.iloc inside __getitem__:
    paths/labels are converted to arrays once, which noticeably reduces
    Python overhead in Colab when many client loaders are created.
    """
    def __init__(self, dataframe, transform=None):
        df_local = dataframe.reset_index(drop=True)
        self.paths = df_local["image_path"].astype(str).to_numpy()
        self.labels = df_local["label_idx"].astype(np.int64).to_numpy()
        self.transform = transform

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        image = Image.open(self.paths[idx]).convert("RGB")
        if self.transform is not None:
            image = self.transform(image)
        return image, int(self.labels[idx])


def make_class_balanced_sampler(dataframe):
    """Return a WeightedRandomSampler using class frequency inside one client.

    This is optional. It helps minority classes and macro-F1, but it may slightly
    reduce top-line accuracy because HAM10000 is strongly imbalanced.
    """
    labels = dataframe["label_idx"].astype(np.int64).to_numpy()
    counts = np.bincount(labels, minlength=CONFIG["NUM_CLASSES"]).astype(np.float64)
    counts = np.maximum(counts, 1.0)
    sample_weights = 1.0 / counts[labels]
    sample_weights = torch.as_tensor(sample_weights, dtype=torch.double)
    return WeightedRandomSampler(sample_weights, num_samples=len(sample_weights), replacement=True)


def make_loader(dataframe, transform, batch_size=None, shuffle=False, balanced_sampler=False):
    if batch_size is None:
        batch_size = CONFIG["BATCH_SIZE"]
    ds = HAM10000Dataset(dataframe, transform=transform)

    sampler = None
    if balanced_sampler:
        sampler = make_class_balanced_sampler(dataframe)
        shuffle = False

    loader_kwargs = dict(
        batch_size=batch_size,
        shuffle=shuffle if sampler is None else False,
        sampler=sampler,
        num_workers=CONFIG["NUM_WORKERS"],
        pin_memory=CONFIG.get("PIN_MEMORY", True) and torch.cuda.is_available(),
        drop_last=False,
    )

    # Only valid when num_workers > 0. Keeping workers off is usually safer
    # on Colab free/T4 for repeated client DataLoader creation.
    if CONFIG["NUM_WORKERS"] > 0:
        loader_kwargs["persistent_workers"] = CONFIG.get("PERSISTENT_WORKERS", True)
        loader_kwargs["prefetch_factor"] = CONFIG.get("PREFETCH_FACTOR", 2)

    return DataLoader(ds, **loader_kwargs)


val_loader = make_loader(val_df, eval_tfms, shuffle=False)
test_loader = make_loader(test_df, eval_tfms, shuffle=False)

print("Val batches:", len(val_loader), "Test batches:", len(test_loader))