exports.get404 = (req, res, next) => {
    res.status(404).render("404", {
        pageTitle: "Page Not Found",
        path: "/404",
        isAuth: false
    });
};

exports.get500 = (req, res, next) => {
    res.status(500).render("500", {
        pageTitle: "Error",
        path: "/500",
        isAuth: false
    });
};

// 422 error complete : 


