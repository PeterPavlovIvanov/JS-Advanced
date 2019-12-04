import { get, post, del, put } from "/requester.js";
import { saveUser, getData, removeUser } from "/storage.js";

(() => {
    const app = Sammy("#container", function () {
        this.use("Handlebars", "hbs");

        this.get("/", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs",
            }).partial("/views/home.hbs");
        });

        this.get("/register", function (ctx) {
            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs",
            }).partial("/views/register.hbs");
            ctx.redirect("/register");
        });

        this.post("/register", function (ctx) {
            const { username, password, repeatPassword } = ctx.params;
            if (password === repeatPassword) {
                post("user", "", { username, password }, "Basic")
                    .then(userInfo => {
                        saveUser(userInfo);
                        let id = userInfo._id;
                        saveAuthInfo(userInfo, id);

                        successfullAlert("User registration successful.")
                        ctx.redirect("/login");
                    }).catch(console.error);
            } else {
                errorAlert("Password and RepeatPassword do not match!");
            }
        });

        this.get("/login", function (ctx) {
            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs",
            }).partial("/views/login.hbs");
            ctx.redirect("/login");
        });

        this.post("/login", function (ctx) {
            const { username, password } = ctx.params;
            post("user", "login", { username, password }, "Basic")
                .then(userInfo => {
                    saveUser(userInfo);
                    let id = userInfo._id;
                    saveAuthInfo(userInfo, id);

                    successfullAlert("User logged in successfully");
                    ctx.redirect("/");
                }).catch(console.error);
        });

        this.get("/logout", function (ctx) {
            let authtoken = JSON.parse(sessionStorage.userInfo);
            authtoken = authtoken._kmd.authtoken;
            sessionStorage.setItem("authtoken", authtoken);

            post("user", "_logout")
                .then(e => {
                    removeUser();
                    ctx.redirect("/");
                    successfullAlert("Logout successful.");
                })
                .catch(console.error);
        });

        this.get("/create", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;
                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs",
            }).partial("/views/create.hbs");
            ctx.redirect("/create");
        });

        this.post("/create", function (ctx) {
            let authtoken = JSON.parse(sessionStorage.userInfo);
            authtoken = authtoken._kmd.authtoken;
            sessionStorage.setItem("authtoken", authtoken);

            const movie = ctx.params;
            movie.genres = movie.genres.split(" ");
            console.log(movie)
            post("appdata", "movies", movie, "Kinvey")
                .then(m => {
                    successfullAlert("Movie created successfully.");
                    ctx.redirect("/");
                }).catch(console.error);
        });

        this.get("/cinema", function (ctx) {
            get("appdata", "movies?query={}&sort={}")
                .then(m => {
                    if (getData("userInfo") !== null) {
                        ctx.isLogged = true;

                        let authtoken = JSON.parse(sessionStorage.userInfo);
                        authtoken = authtoken._kmd.authtoken;
                        sessionStorage.setItem("authtoken", authtoken);

                        ctx.username = JSON.parse(getData("userInfo")).username;
                    }

                    ctx.allMovies = [];
                    for (let i = 0; i < m.length; i++) {
                        ctx.allMovies.push(m[i]);
                    }

                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/cinema.hbs");
                });
        });

        this.get("/myMovies", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let str = sessionStorage.userInfo;
            let user_id = JSON.parse(str)._id;
            get("appdata", `movies?query={"_acl.creator":"${user_id}"}`)
                .then(m => {

                    ctx.myMovies = [];
                    for (let i = 0; i < m.length; i++) {
                        ctx.myMovies.push(m[i]);
                    }

                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/myMovies.hbs");
                    ctx.redirect("/myMovies");
                }).catch(console.error);
        });

        this.get("/details/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let movie_id = ctx.params.id;
            get("appdata", `movies/${movie_id}`)
                .then(m => {
                    ctx.title = m.title;
                    ctx.imageUrl = "." + m.imageUrl;
                    ctx.description = m.description;
                    ctx.tickets = m.tickets;
                    ctx.genres = m.genres;

                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/details.hbs");
                    ctx.redirect(`/details/${movie_id}`);
                }).catch(console.error);
        });

        this.get("/edit/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let movie_id = ctx.params.id;
            sessionStorage.setItem("movieId", movie_id);
            get("appdata", `movies/${movie_id}`)
                .then(m => {
                    ctx.title = m.title;
                    ctx.imageUrl = m.imageUrl;
                    ctx.description = m.description;
                    ctx.tickets = m.tickets;
                    ctx.genres = m.genres.join(" ");
                    ctx._id = movie_id;

                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/edit.hbs");
                    ctx.redirect(`/edit/${movie_id}`);
                }).catch(console.error);
        });
        this.post("/edit/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let movie_id = sessionStorage.movieId;
            ctx._id = movie_id;
            let body = ctx.params
            put("appdata", `movies/${movie_id}`, body, "Kinvey")
                .then(m => {
                    console.log(m);
                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/details.hbs");
                    successfullAlert("Movie edited successfully.");
                    ctx.redirect(`/details/${movie_id}`);
                }).catch(console.error);

        });

        this.get("/buy/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let movieId = ctx.params.id;
            ctx._id = ctx.params.id;
            get("appdata", `movies/${movieId}`)
                .then(m => {
                    if (m.tickets > 0) {
                        m.tickets--;
                        put("appdata", `movies/${movieId}`, m, "Kinvey")
                            .then(e => {
                                successfullAlert(`Successfully bought ticket for ${e.title}!`);
                            })
                            .catch(console.error);
                    } else {
                        errorAlert("Out of tickets!");
                    }
                }).catch(console.error);
        });

        this.get("/delete/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let movie_id = ctx.params.id;
            ctx._id = ctx.params.id;
            get("appdata", `movies/${movie_id}`)
                .then(movieToDel => {
                    ctx.title = movieToDel.title;
                    ctx.imageUrl = movieToDel.imageUrl;
                    ctx.description = movieToDel.description;
                    ctx.tickets = movieToDel.tickets;
                    ctx.genres = movieToDel.genres;

                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/delete.hbs");
                    ctx.redirect(`/delete/${movie_id}`);
                }).catch(console.error);
        });

        this.post("/delete/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }
            let movie_id = ctx.params.id;
            del("appdata", `movies/${movie_id}`, sessionStorage.getItem("movieToDel"), "Kinvey")
                .then(movieToDel => {
                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/cinema.hbs");
                    successfullAlert("Movie removed successfully!");
                    ctx.redirect("/myMovies");
                }).catch(console.error);
        });
    });

    app.run();

})()

function saveAuthInfo(userInfo, id) {
    sessionStorage.setItem("_id", id);
    sessionStorage.setItem("username", userInfo.username);
    sessionStorage.setItem("password", userInfo.password);
}

function successfullAlert(message) {
    let box = document.getElementById("infoBox")
    let span = document.createElement("span");
    span.textContent = message;
    box.appendChild(span);
    box.style.display = "block";
    setTimeout(() => {
        box.style.display = "none";
    }, 2000);
}

function errorAlert(message) {
    let box = document.getElementById("errorBox")
    let span = document.createElement("span");
    span.textContent = message;
    box.appendChild(span);
    box.style.display = "block";
    setTimeout(() => {
        box.style.display = "none";
        box.removeChild(span);
    }, 2000);
}