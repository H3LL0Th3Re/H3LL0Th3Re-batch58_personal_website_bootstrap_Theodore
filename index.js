const express = require('express');
const methodOverride = require('method-override');
const router = require('./router'); // Import your router.js

const app = express();
const PORT = process.env.PORT || 5501;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Static assets and view engine setup
app.set('view engine', 'hbs');
app.use("/views", express.static("views"));
app.use("/assets/css", express.static("assets/css"));
app.use("/assets/js", express.static("assets/js"));
app.use("/assets/img", express.static("assets/img"));

// Use the router
app.use('/', router);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
