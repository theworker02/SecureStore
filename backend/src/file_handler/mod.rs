use std::{
    fs,
    path::{Path, PathBuf},
};

use crate::VaultError;

pub fn write_blob(path: &Path, bytes: &[u8]) -> Result<(), VaultError> {
    fs::write(path, bytes).map_err(VaultError::Io)
}

pub fn read_blob(path: &Path) -> Result<Vec<u8>, VaultError> {
    fs::read(path).map_err(VaultError::Io)
}

pub fn delete_blob(path: &Path) -> Result<(), VaultError> {
    if path.exists() {
        fs::remove_file(path).map_err(VaultError::Io)?;
    }
    Ok(())
}

pub fn reset_dir(path: &Path) -> Result<(), VaultError> {
    if path.exists() {
        fs::remove_dir_all(path).map_err(VaultError::Io)?;
    }
    fs::create_dir_all(path).map_err(VaultError::Io)
}

pub fn blob_path(files_dir: &Path, id: &str) -> PathBuf {
    files_dir.join(format!("{id}.bin"))
}
