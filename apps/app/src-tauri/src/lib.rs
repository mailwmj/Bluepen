#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      if let Some(config) = app.config().app.windows.first() {
        let mut builder = tauri::WebviewWindowBuilder::from_config(app.handle(), config)?;
        #[cfg(target_os = "macos")]
        {
          builder = builder.traffic_light_position(tauri::LogicalPosition::new(16.0, 14.0));
        }
        builder.build()?;
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
