const express = require('express');
const pool = require('./db');
const methodOverride = require('method-override');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5501;
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Static assets and view engine setup
app.set('view engine', 'hbs');
app.use("/views", express.static("views"));
app.use("/assets/css", express.static("assets/css"));
app.use("/assets/js", express.static("assets/js"));
app.use("/assets/img", express.static("assets/img"));

app.get("/", (req, res) => res.render("index"));
app.get("/add-project", (req, res) => res.render("blog"));
app.get("/contact", (req, res) => res.render("contact"));
app.get("/testimonial", (req, res) => res.render("testimonial"));
app.get("/blog-detail", (req, res) => res.render("blog_detail"));
app.get("/edit-project", (req, res) => res.render("edit_project"));

// Add a new project
app.post('/add-project', async (req, res) => {
    const { title, description, startDate, endDate, technologies, imageUrl } = req.body;

    try {
        if (!title || !description || !startDate || !endDate || !imageUrl) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Properly format technologies
        const technologiesJSON = Array.isArray(technologies) ? JSON.stringify(technologies) : JSON.stringify([technologies]);

        const result = await pool.query(
            'INSERT INTO projects (title, description, start_date, end_date, technologies, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [title, description, startDate, endDate, technologiesJSON, imageUrl]
        );

        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Update project
app.put('/update-project/:id', upload.single('image'), async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, start_date, end_date, technologies } = req.body;
    const imageUrl = req.file ? req.file.buffer.toString('base64') : null;

    try {
        // Ensure all required fields are provided
        if (!title || !description || !start_date || !end_date) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        // Parse technologies correctly
        let parsedTechnologies = [];
        if (technologies) {
            if (typeof technologies === 'string') {
                try {
                    // Attempt to parse the string
                    parsedTechnologies = JSON.parse(technologies);
                } catch (error) {
                    return res.status(400).json({ error: 'Invalid technologies format' });
                }
            } else if (Array.isArray(technologies)) {
                parsedTechnologies = technologies; // Use array directly
            } else {
                parsedTechnologies = [technologies]; // Convert single value to array
            }
        }

        const technologiesJSON = JSON.stringify(parsedTechnologies); // Convert to JSON string

        // Update the project in the database
        await pool.query(
            'UPDATE projects SET title = $1, description = $2, start_date = $3, end_date = $4, technologies = $5, image_url = $6 WHERE id = $7',
            [title, description, start_date, end_date, technologiesJSON, imageUrl, id]
        );

        res.sendStatus(204); // No Content
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});


// Blog details route
app.get('/blog-detail/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = result.rows[0];
        project.duration = calculateDuration(project.start_date, project.end_date);
        project.technologies = JSON.parse(project.technologies || '[]');

        res.render('blog_detail', { blog: project });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Edit project route
app.get('/edit-project/:id', async (req, res) => {
    const { id } = req.params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
        return res.status(400).send('Invalid project ID');
    }

    try {
        const result = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);

        if (result.rows.length === 0) {
            return res.status(404).send('Project not found');
        }

        const project = result.rows[0];
        project.technologies = JSON.parse(project.technologies || '[]');

        const allTechnologies = ['Node JS', 'React JS', 'Next JS', 'Type Script'];
        project.technologyCheck = allTechnologies.map(tech => ({
            name: tech,
            checked: project.technologies.includes(tech)
        }));

        res.render('edit_project', { project });
    } catch (err) {
        console.error('Error fetching project:', err);
        res.status(500).send('Server error');
    }
});

// Delete project
app.delete('/delete-project/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.sendStatus(204);
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get all projects
app.get('/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects');
        res.json(result.rows.map(row => ({
            ...row,
            technologies: JSON.parse(row.technologies || '[]'),
            duration: calculateDuration(row.start_date, row.end_date)
        })));
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Helper function to calculate project duration
function calculateDuration(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) return 'Invalid dates';

    const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    const months = Math.floor(duration / 30);
    const days = duration % 30;
    return `${months} month(s) and ${days} day(s)`;
}

// Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

module.exports = router;