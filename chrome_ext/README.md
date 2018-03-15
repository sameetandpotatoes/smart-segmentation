## Smart-segmentations

### Build instructions:

To install dependencies:

  # in case you don't have webpack yet:
  sudo npm install -g webpack

  cd cs511-segmentation/chrome_ext

  # if you have yarn:
  yarn --ignore-engines

  # otherwise,
  npm install

Then to start a developing session (with watch), run:

    npm start

To start a unit testing session (with watch):

    npm test

To check code for linting errors:

    npm run lint


To build production code + crx:

    npm run build


### Development:

    npm start

Open Chrome, `Window` -> `Extensions`,
`Load Unpacked Extension`, and select `./build/dev/manifest.json`


### Directory structure:

    /build             # this is where your extension (.crx) will end up,
                       # along with unpacked directories of production and
                       # develop build (for debugging)

    /src
        /css           # CSS files
        /html          # HTML files
        /images        # image resources

        /js            # entry-points for browserify, requiring node.js `modules`
        manifest.json  # skeleton manifest file, `name`, `description`
                       #   and `version` fields copied from `package.json`       

    /webpack           # webpack configuration files

    .babelrc           # Babel configuration
    .eslintrc          # options for JS-linting
    package.json       # project description file (name, version, dependencies, ...)
