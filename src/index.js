const core = require('@actions/core')
const { discloud } = require("discloud.app");
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

const run = async () => {
  try {
    const token = core.getInput('token')
    const appID = core.getInput('appID')
    const hasTeam = Boolean(core.getInput('teams'))
    const path = core.getInput('path')
    
    if (!fs.existsSync(path)) throw new Error(`Directory ${path} does not exist`);
    const zipPath = path.join(process.cwd(), 'src.zip')
    
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    archive.pipe(output)
    archive.directory(path, false)
    await archive.finalize()
    
    output.on('close', async () => {
      await discloud.login(token)
      const client = hasTeam ? discloud.appTeam : discloud.apps
      const app = await client.fetch(appID)
      if (!app) throw new Error(`App with ID ${appID} not found`)
      await app.update({ file: zipPath })
    })
    
    archive.on('error', (err) => {throw err});
    
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()