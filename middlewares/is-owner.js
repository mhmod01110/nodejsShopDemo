module.exports = (req, res, next) => {
    if (!req.session.user || !req.session.user.isOwner) {
        return res.status(403).render('403', {
            pageTitle: 'Access Denied',
            path: '/403',
            isAuthenticated: req.session.isLoggedIn
        });
    }
    next();
}; 