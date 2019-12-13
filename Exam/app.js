import { get, post, del, put } from "/requester.js";
import { saveUser, getData, removeUser } from "/storage.js";

(() => {
    const app = Sammy("body", function () {
        this.use("Handlebars", "hbs");

        this.get("/", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;

                ctx.treks = [];
                get("appdata", "treks")
                    .then(arr => {
                        arr.forEach(trek => {

                            ctx.treks.push(trek);
                        });

                        this.loadPartials({
                            header: "/views/header.hbs",
                            footer: "/views/footer.hbs",
                        }).partial("/views/home.hbs");
                    })
                    .catch(console.error);
            } else {
                this.loadPartials({
                    header: "/views/header.hbs",
                    footer: "/views/footer.hbs",
                }).partial("/views/home.hbs");
            }
        });

        this.get("/index.html", function (ctx) {
            ctx.redirect("/");
        });

        this.get("/register", function (ctx) {
            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs",
            }).partial("/views/register.hbs");
            ctx.redirect("/register");
        });

        this.post("/register", function (ctx) {
            let { username, password, rePassword } = ctx.params;
            if (password === rePassword) {
                if (username.length >= 3) {
                    if (password.length >= 6) {
                        post("user", "", { username, password }, "Basic")
                            .then(userInfo => {
                                saveUser(userInfo);
                                let id = userInfo._id;
                                saveAuthInfo(userInfo, id);

                                this.loadPartials({
                                    header: "/views/header.hbs",
                                    footer: "/views/footer.hbs",
                                }).partial("/views/register.hbs");
                                ctx.redirect("/");
                            })
                            .catch(e => alert(e));
                    } else {
                        alert("Password should be atleast 6 characters long !");
                    }
                } else {
                    alert("Username should be atleast 3 characters long !");
                }
            } else {
                alert("Password and repeated password do not match !");
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

                    ctx.redirect("/");
                }).catch(e => alert(e));
        });

        this.get("/logout", function (ctx) {
            let authtoken = JSON.parse(sessionStorage.userInfo);
            authtoken = authtoken._kmd.authtoken;
            sessionStorage.setItem("authtoken", authtoken);

            post("user", "_logout")
                .then(() => {
                    removeUser();
                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs"
                    }).partial("/views/home.hbs");
                    ctx.redirect("/");
                });
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

            const trek = ctx.params;
            trek.likes = "0";
            trek.organizer = `${JSON.parse(getData("userInfo")).username}`;

            post("appdata", "treks", trek, "Kinvey")
                .then(m => {
                    ctx.redirect("/");
                }).catch(e => alert(e));
        });

        this.get("/profile", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let user_Id = JSON.parse(sessionStorage.userInfo)._id;
            get("appdata", `treks?query={"_acl.creator":"${user_Id}"}`)
                .then(treks => {
                    ctx.myTreks = [];
                    treks.forEach(trek => {
                        ctx.myTreks.push(trek);
                    });
                    ctx.wishedTreks = ctx.myTreks.length;
                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs"
                    }).partial("/views/profile.hbs");
                    ctx.redirect("/profile");
                })
                .catch(e => `Error in profile get: ${e}`);
        });

        this.get("/details/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let trek_id = ctx.params.id;
            ctx._id = ctx.params.id;
            sessionStorage.setItem("trek_id", trek_id);
            get("appdata", `treks/${trek_id}`)
                .then(m => {
                    ctx.location = m.location;
                    ctx.imageURL = "../" + m.imageURL;
                    ctx.description = m.description;
                    ctx.dateTime = m.dateTime;
                    ctx.organizer = m.organizer;
                    ctx.likes = m.likes;
                    if (ctx.organizer === ctx.username) {
                        ctx.isOrganizer = true;
                    }

                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/details.hbs");
                    ctx.redirect(`/details/${trek_id}`);
                }).catch(e => alert(e));
        });

        this.get("/close/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;
                ctx.username = JSON.parse(getData("userInfo")).username;
                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);
            }

            ctx._id = ctx.params.id;
            del("appdata", `treks/${sessionStorage.getItem("trek_id")}`)
                .then(e => {
                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/home.hbs");
                    ctx.redirect("/");
                }).catch(e => alert(e));
        });

        this.get("/like/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let treckId = ctx.params.id;
            ctx._id = ctx.params.id;
            get("appdata", `treks/${treckId}`)
                .then(m => {
                    m.likes++;
                    put("appdata", `treks/${treckId}`, m, "Kinvey")
                        .then(e => {
                            ctx.redirect(`/details/${treckId}`);
                        })
                        .catch(console.error);
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

            let trek_id = ctx.params.id;
            sessionStorage.setItem("trek_id", trek_id);
            get("appdata", `treks/${trek_id}`)
                .then(m => {
                    ctx.location = m.location;
                    ctx.imageURL = m.imageURL;
                    ctx.description = m.description;
                    ctx.dateTime = m.dateTime;
                    ctx.likes = m.likes;
                    ctx.organizer = m.organizer;
                    ctx._id = trek_id;
                    sessionStorage.setItem("likes", ctx.likes);
                    sessionStorage.setItem("organizer", ctx.organizer);

                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs",
                    }).partial("/views/edit.hbs");
                    ctx.redirect(`/edit/${trek_id}`);
                }).catch(console.error);
        });

        this.post("/edit/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;
                ctx.username = JSON.parse(getData("userInfo")).username;
            }
            let authtoken = JSON.parse(sessionStorage.userInfo);
            authtoken = authtoken._kmd.authtoken;
            sessionStorage.setItem("authtoken", authtoken);

            let body = ctx.params;
            body.likes = sessionStorage.getItem("likes");
            body.organizer = sessionStorage.getItem("organizer");
            const { location, dateTime, description, imageURL, likes, organizer } = body;

            get("appdata", `treks/${ctx.params.id}`, "Kinvey")
                .then(e => {
                    ctx.location = e.location;
                    ctx.dateTime = e.dateTime;
                    ctx.description = e.description;
                    ctx.imageURL = e.imageURL;
                    ctx.likes = e.likes;
                    ctx.organizer = e.organizer;
                    ctx.id = e._id;

                    put("appdata", `treks/${ctx.params.id}`, { location, dateTime, description, imageURL, likes, organizer }, "Kinvey")
                        .then(e => {
                            ctx.redirect("/");
                        })
                        .catch(e => alert(e));
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