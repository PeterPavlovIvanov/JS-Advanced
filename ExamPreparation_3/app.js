import { get, post, del, put } from "/requester.js";
import { saveUser, getData, removeUser } from "/storage.js";

(() => {
    const app = Sammy("#rooter", function () {
        this.use("Handlebars", "hbs");

        this.get("/", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
                ctx.firstName = JSON.parse(getData("userInfo")).firstName;
                ctx.lastName = JSON.parse(getData("userInfo")).lastName;

                get("appdata", "recipes")
                    .then(arr => {
                        ctx.recipes = arr;
                        ctx.recipes.ingredients = JSON.stringify(arr.ingredients);
                        this.loadPartials({
                            header: "/views/header.hbs",
                            list: "/views/list.hbs",
                            footer: "/views/footer.hbs",
                        }).partial("/views/home.hbs");
                    }).catch(console.error);
            } else {
                this.loadPartials({
                    header: "/views/header.hbs",
                    list: "/views/list.hbs",
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
            ctx.redirect("/register")
        });

        this.post("/register", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            const { username, password, firstName, lastName, repeatPassword } = ctx.params;
            if (password === repeatPassword) {
                post("user", "", { username, password, firstName, lastName }, "Basic")
                    .then(userInfo => {
                        let id = userInfo._id;
                        saveAuthInfo(userInfo, id);
                        ctx.redirect("/");
                    });
            } else {
                ///TODO
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
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            const { username, password } = ctx.params;

            post("user", "login", { username, password }, "Basic")
                .then(userInfo => {
                    saveUser(userInfo);
                    let id = userInfo._id;
                    saveAuthInfo(userInfo, id);
                    ctx.redirect("/");
                });
        });

        this.get("/logout", function (ctx) {
            let authtoken = JSON.parse(sessionStorage.userInfo);
            authtoken = authtoken._kmd.authtoken;
            sessionStorage.setItem("authtoken", authtoken);

            post("user", "_logout")
                .then(e => {
                    removeUser();
                    ctx.redirect("/");
                })
                .catch(console.error);
        });

        this.get("/share", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                ctx.username = JSON.parse(getData("userInfo")).username;
                ctx.firstName = JSON.parse(getData("userInfo")).firstName;
                ctx.lastName = JSON.parse(getData("userInfo")).lastName;
            }

            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs",
            }).partial("/views/share.hbs");
            ctx.redirect("/share");
        });

        this.post("/share", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
                ctx.firstName = JSON.parse(getData("userInfo")).firstName;
                ctx.lastName = JSON.parse(getData("userInfo")).lastName;
            }

            let body = ctx.params;
            body.likesCounter = "0";
            body.ingredients = ctx.params.ingredients.split(" ");
            post("appdata", "recipes", body, "Kinvey")
                .then(e => {
                    ctx.redirect("/");
                }).catch(console.error);
        });

    });

    app.run();
})()

function saveAuthInfo(userInfo, id) {
    sessionStorage.setItem("_id", id);
    sessionStorage.setItem("username", userInfo.username);
    sessionStorage.setItem("password", userInfo.password);
    if (userInfo.firstname !== null) {
        sessionStorage.setItem("firstname", userInfo.firstname);
        sessionStorage.setItem("lastname", userInfo.lastname);
    }
}