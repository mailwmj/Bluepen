const SERVICE: &str = "im.bluepen.agent";
const ACCOUNT: &str = "api-key";

#[tauri::command]
pub fn read_agent_key() -> Result<String, String> {
    let entry = keyring::Entry::new(SERVICE, ACCOUNT)
        .map_err(|_| "无法访问系统凭据库".to_string())?;
    match entry.get_password() {
        Ok(key) => Ok(key),
        Err(keyring::Error::NoEntry) => Ok(String::new()),
        Err(_) => Err("无法读取 API Key，请检查系统凭据库权限".to_string()),
    }
}

#[tauri::command]
pub fn write_agent_key(api_key: String) -> Result<(), String> {
    let entry = keyring::Entry::new(SERVICE, ACCOUNT)
        .map_err(|_| "无法访问系统凭据库".to_string())?;
    let result = if api_key.is_empty() { entry.delete_credential() } else { entry.set_password(&api_key) };
    match result {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(_) => Err("无法保存 API Key，请检查系统凭据库权限".to_string()),
    }
}

#[cfg(test)]
mod tests {
    // Explicitly invoked integration check uses a separate temporary account.
    #[test]
    #[ignore = "requires an unlocked native credential store"]
    fn native_credential_round_trip() {
        let account = format!("verification-{}", std::process::id());
        let entry = keyring::Entry::new(SERVICE_FOR_TEST, &account).unwrap();
        entry.set_password("bluepen-test-value-not-a-key").unwrap();
        let read = entry.get_password();
        let removed = entry.delete_credential();
        assert_eq!(read.unwrap(), "bluepen-test-value-not-a-key");
        removed.unwrap();
        assert!(matches!(entry.get_password(), Err(keyring::Error::NoEntry)));
    }
    const SERVICE_FOR_TEST: &str = "im.bluepen.agent.verification";
}
