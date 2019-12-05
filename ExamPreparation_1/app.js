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

                get("appdata", "events")
                    .then(events1 => {
                        ctx.events = events1;

                        this.loadPartials({
                            header: "/views/header.hbs",
                            list: "/views/list.hbs",
                            footer: "/views/footer.hbs"
                        }).partial("/views/home.hbs");
                        ctx.redirect("/");
                    }).catch(e => `Error in events log ${e}`);
            } else {
                this.loadPartials({
                    header: "/views/header.hbs",
                    list: "/views/list.hbs",
                    footer: "/views/footer.hbs"
                }).partial("/views/home.hbs");
                ctx.redirect("/");
            }
        });

        this.get("/register", function (ctx) {
            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs"
            }).partial("/views/register.hbs");
            ctx.redirect("/register");
        });

        this.post("/register", function (ctx) {
            const { username, password, rePassword, } = ctx.params;
            if (username && password && password === rePassword) {
                post("user", "", { username, password }, "Basic")
                    .then((userInfo) => {
                        saveUser(userInfo);
                        let id = userInfo._id;
                        saveAuthInfo(userInfo, id);
                    })
                    .catch(e => console.log(`In Register post form : ${e}`));
                ctx.redirect("/login");
            }
        });

        this.get("/login", function (ctx) {
            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs"
            }).partial("/views/login.hbs");
            ctx.redirect("/login");
        });

        this.post("/login", function (ctx) {
            const { username, password } = ctx.params;
            if (username && password) {
                post("user", "login", { username, password }, "Basic")
                    .then((userInfo) => {
                        saveUser(userInfo);
                        let id = userInfo._id;
                        saveAuthInfo(userInfo, id);
                        ctx.redirect("/");
                    }).catch(e => console.log(`In Login post form : ${e}`));
            }
        });

        this.get("/logout", function (ctx) {
            let authtoken = JSON.parse(sessionStorage.userInfo);
            authtoken = authtoken._kmd.authtoken;
            sessionStorage.setItem("authtoken", authtoken);

            post(`user`, "_logout")
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
            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs"
            }).partial("/views/create.hbs");
            ctx.redirect("/create");

            if (getData("userInfo") !== null) {
                ctx.isLogged = true;
                ctx.username = JSON.parse(getData("userInfo")).username;
            }
        });

        this.post("/create", function (ctx) {
            let { name, dateTime, imageURL, description } = ctx.params;
            let body = { name, dateTime, imageURL, description };
            body.peopleInterestedIn = 0;
            body.organizer = `${JSON.parse(getData("userInfo")).username}`;

            let authtoken = JSON.parse(sessionStorage.userInfo);
            authtoken = authtoken._kmd.authtoken;
            sessionStorage.setItem("authtoken", authtoken);

            post("appdata", "events", body, "Kinvey")
                .then(e => {
                    sessionStorage.events.push(e);
                })
                .catch(e => `Error in post create ${e}`);

            ctx.redirect("/");
        });

        this.get("/profile", function (ctx) {
            console.log(ctx.params);
            console.log(ctx)
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;

                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);

                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            let user_Id = JSON.parse(sessionStorage.userInfo)._id;
            get("appdata", `events?query={"_acl.creator":"${user_Id}"}`, "Kinvey")
                .then(events => {
                    ctx.personalEvents = events;
                    ctx.numberOfEvents = ctx.personalEvents.length;

                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs"
                    }).partial("/views/profile.hbs");
                    ctx.redirect("/profile");
                })
                .catch(e => `Error in profile get: ${e}`);
        });

        this.get("/description/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;
                ctx.username = JSON.parse(getData("userInfo")).username;
            }

            get("appdata", `events/${ctx.params.id}`, "Kinvey")
                .then(e => {
                    Object.assign(ctx, e);
                    Object.assign(sessionStorage, e);

                    if (ctx.username == ctx.organizer) {
                        ctx.isOwner = true;
                    }

                    this.loadPartials({
                        header: "/views/header.hbs",
                        footer: "/views/footer.hbs"
                    }).partial("/views/description.hbs");
                    ctx.redirect(`/description/${ctx.params.id}`);
                })
                .catch(e => `Error in description : ${e}`);
        });

        this.get("/edit/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;
                ctx.username = JSON.parse(getData("userInfo")).username;
            }
            let authtoken = JSON.parse(sessionStorage.userInfo);
            authtoken = authtoken._kmd.authtoken;
            sessionStorage.setItem("authtoken", authtoken);

            ctx.name = sessionStorage.getItem("name");
            ctx.dateTime = sessionStorage.getItem("dateTime");
            ctx.description = sessionStorage.getItem("description");
            ctx.imageURL = sessionStorage.getItem("imageURL");
            ctx.peopleInterestedIn = sessionStorage.getItem("peopleInterestedIn");
            ctx.organizer = sessionStorage.getItem("organizer");
            sessionStorage.setItem("eventId", ctx.params.id);//Important, in post edit is used for taking the id of the event...

            this.loadPartials({
                header: "/views/header.hbs",
                footer: "/views/footer.hbs"
            }).partial("/views/edit.hbs");
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
            body.peopleInterestedIn = sessionStorage.getItem("peopleInterestedIn");
            body.organizer = sessionStorage.getItem("organizer");
            const { name, dateTime, description, imageURL, peopleInterestedIn, organizer } = body;

            get("appdata", `events/${sessionStorage.eventId}`, "Kinvey")
                .then(e => {
                    ctx.name = e.name;
                    ctx.dateTime = e.dateTime;
                    ctx.description = e.description;
                    ctx.imageURL = e.imageURL;
                    ctx.peopleInterestedIn = e.peopleInterestedIn;
                    ctx.organizer = e.organizer;
                    ctx.id = e._id;

                    put("appdata", `events/${sessionStorage.eventId}`, { name, dateTime, description, imageURL, peopleInterestedIn, organizer }, "Kinvey")
                        .then(e => {
                            ctx.redirect(`/description/${sessionStorage.eventId}`);
                        })
                        .catch(console.error);
                }).catch(console.error);
        });

        this.get("/join/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;
                ctx.username = JSON.parse(getData("userInfo")).username;
                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);
            }

            let eventId;
            let body1;

            get("appdata", `events/${ctx.params.id}`, "Kinvey")
                .then(event => {
                    event.peopleInterestedIn++;
                    Object.assign(ctx.params, event);
                    body1 = ctx.params;
                    delete body1._acl;
                    delete body1._kmd;
                    delete body1.id;
                    eventId = body1._id;
                    delete body1._id;

                    put("appdata", `events/${eventId}`, body1, "Kinvey")
                        .then(e => {
                            Object.assign(ctx, e);
                            Object.assign(sessionStorage, e);
                            ctx.redirect(`/description/${eventId}`);
                        })
                        .catch(console.log);
                })
                .catch(console.error);
        });

        this.get("/close/:id", function (ctx) {
            if (getData("userInfo") !== null) {
                ctx.isLogged = true;
                ctx.username = JSON.parse(getData("userInfo")).username;
                let authtoken = JSON.parse(sessionStorage.userInfo);
                authtoken = authtoken._kmd.authtoken;
                sessionStorage.setItem("authtoken", authtoken);
            }

            del("appdata", `events/${ctx.params.id}`, "Kinvey")
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
}

function displayError(message) {
    const errorBox = document.getElementById("errorBox");
    errorBox.style.display = "block";
    errorBox.context = message;
    setTimeout(() => {
        errorBox.style.display = "none";
    }, 2000);
}

function displaySuccess(message) {
    const box = document.getElementById("successBox");
    box.context = message;
    box.style.display = "block";
    setTimeout(() => {
        box.style.display = "none";
    }, 2000);
}