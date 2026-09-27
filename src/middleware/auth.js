export function requirePageLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    return next();
}

export function requireApiLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            error: 'Authentication required.'
        });
    }

    return next();
}

export function requirePageRole(role) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        if (req.session.user.role !== role) {
            return res.status(403).render('errors/403', {
                title: 'Forbidden',
                error: 'You do not have permission to access this page.'
            });
        }

        return next();
    };
}

export function requireApiRole(role) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({
                error: 'Authentication required.'
            });
        }

        if (req.session.user.role !== role) {
            return res.status(403).json({
                error: 'You do not have permission to access this resource.'
            });
        }

        return next();
    };
}