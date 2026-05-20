const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

function setupAutoUpdater() {
  // 1. Check for updates right away silently
  autoUpdater.checkForUpdatesAndNotify();

  // 2. Log when an update is found (optional: send IPC to frontend)
  autoUpdater.on('update-available', (info) => {
    console.log(`Update available: Version ${info.version}`);
  });

  // 3. Prompt the user when the download is complete
  autoUpdater.on('update-downloaded', (info) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart and Install', 'Later'],
      title: 'Application Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'Restart the application to apply the updates seamlessly.'
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      // If the user clicks "Restart and Install" (index 0)
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // 4. Handle any errors gracefully
  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater:', err);
  });
}

// Export the function so main.cjs can use it
module.exports = { setupAutoUpdater };