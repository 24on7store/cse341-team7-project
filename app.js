import express from 'express';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import Path from 'path';
import { fileURLToPath } from 'url';
import pkg from './package.json' with { type: 'json' };
import swaggerSpec from './swagger.js';
import globalMiddleware from './src/middleware/global.js';
import routes from './src/routes/router.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const app = express();
app.locals.NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
app.locals.user = null;

// Add version info to res.locals for access in templates.
app.use((req, res, next) => {
    res.locals.appVersion = pkg.version;
    next();
});

// Configure static files and EJS templates.
app.use(express.static(Path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', Path.join(__dirname, 'src/views'));

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'a_temporary_local_development_secret_override_string_123',
        resave: false,
        saveUninitialized: false,
        //Added to reset cookie after expiration on every response
        rolling: true,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            //Commented because the page should be 1-hour inactivity tmeout rather than 24 hours
            // maxAge: 1000 * 60 * 60 * 24
            maxAge: 60 * 60 * 1000
        }
    })
);
//ADDED ON WEEK04 #2 
//ACTIVATE STEP 5 SESSION LOADING GLOBALLY HERE:
app.use(loadSessionUser); 

//ADDED ON WEEK04 #2 
import { loadSessionUser } from './src/middleware/auth.js';

// STEP 6: Load the user BEFORE any page or API routes
app.use(loadSessionUser);

//Routes and other middleware run after this
app.use(globalMiddleware);
app.use('/', routes);


app.use(globalMiddleware);
app.use('/', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Catch requests that did not match a route.
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Render the appropriate error page.
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    return res.status(status).render(`errors/${template}`, context);
});

export default app;
