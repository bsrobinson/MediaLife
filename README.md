# MediaLife
Based on https://github.com/bsrobinson/AspNetMvcWebpack-Template/

## Running the Application Locally

Once you have created a new repository from this template you should run the template to make sure everything is working as you expect.

### Using Visual Studio Code

The best way to run the application is using Visual Studio Code.

To run, open the template root in a new Code window; then in the teminal type:

```bash
npm start
```

This will:

- Install required nuget and npm packages (on the first run or if they go missing)
  *npm install is triggered by the dotnet build*

- Clean the build output, deleting files generated during a build.

- Build the .Net (BE) and Webpack (FE) parts of the application.

- Trigger `dotnet watch` and `webpack watch` to monitor for changes and rebuild on the fly *(this step triggers the build step above)*.

- Launch the application in your default browser *(triggered by dotnet watch)*


## Updating from the Template

If this template is updated, you can copy the changes into your application by running:

```node
npm run update-template
```

This process is still quite manual, but the script hopes to make it as easy as possible.  You should only run it in a souce controlled environment, as the changes will be made directly to your project, and will need careful manual review.

The first time you run the script you'll be asked when to update from; which will default to your first commit.  The date last updated will be saved to a file; commit this file to make future updates simpler.
