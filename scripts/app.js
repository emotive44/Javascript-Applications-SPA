$(() => {
    const app = Sammy('#main', function () {
        // TODO: Define all the routes
        this.use('Handlebars', 'hbs');
        let authToken = sessionStorage.getItem('authtoken');

        this.get('#/home', function(context) { 
            sessionStorage.isAuthor = false;  //// set initial value
            sessionStorage.isOnTeam = false; ////
            
            this.hasTeam = sessionStorage.getItem('hasTeam'); //// if user has a team, hasTeam will be true, and show link to him team
            this.loggedIn = !!sessionStorage.getItem('username'); //// if is login will be true, else false
            this.username = sessionStorage.getItem('username'); //// get a name on user
            this.teamId = sessionStorage.getItem('teamId');
            this.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function() {
                this.partial('./templates/home/home.hbs'); //// load home page 
            });

        });

        this.get('#/about', function() {
            this.loggedIn = !!sessionStorage.getItem('username'); //// with this we show Welcom, username
            this.username = sessionStorage.getItem('username');  //// if is true(login)

            this.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function() {
                this.partial('./templates/about/about.hbs') //// load about page
            });
        });

        this.get('#/login', function(context) {
            this.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                loginForm: './templates/login/loginForm.hbs'
            }).then(function() {
                this.partial('./templates/login/loginPage.hbs'); //// load loginPage and after user is loggedin
            });
            
            this.redirect('#/home') //// we load home page
        });

        this.post('#/login', function(context) {
            let that = this;
            let {username, password} = context.params;  //// take username and password
            auth.login(username, password)  //// make a login if everything is correct
                .then(function(res) {
                    auth.saveSession(res);
                    auth.showInfo('Login Successfully'); //// show window after successfully login
                    that.redirect('#/home') //// go to home
                }).catch((e) => auth.showError('Not Valid username or password'));
        });

        this.get('#/logout', function() {
            let that = this;
            auth.logout()  //// make a logout
                .then(function() {
                    sessionStorage.clear();
                    auth.showInfo('Logout Successfully'); //// show window after correct logout
                    that.redirect('#/home'); //// go to home
                });
        });

        this.get('#/register', function() {
            this.loadPartials({
                header: './templates/common/header.hbs',
                registerForm: './templates/register/registerForm.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function() {
                this.partial('./templates/register/registerPage.hbs'); //// load register page
            });
        });

        this.post('#/register', function(context) {
            let that = this;
            let {username, password, repeatPassword} = context.params;
            auth.register(username, password, repeatPassword) //// make a register if username is free
                .then(function(res) {
                    auth.saveSession(res);
                    auth.showInfo('Registered Successfully'); //// show window after correct register
                    that.redirect('#/home'); //// go to home
                }).catch((e) => auth.showError('Not Valid username or password'));
        });

        this.get('#/catalog', async function(context) {
            this.loggedIn = !!sessionStorage.getItem('username');  //// if is login will be true, else false
            this.username = sessionStorage.getItem('username'); //// get a name on user
            this.hasTeam = sessionStorage.getItem('hasTeam');
            let arrayWithTeams = await requester.get('appdata', 'teams', authToken) ////get all teams
                        .then(res => {
                            let ar = [];
                            console.log(res)
                            for(let i = 1500; i < res.length; i++) {
                                ar.push(res[i]);
                            }
                            return ar;
                        });
            this.teams = arrayWithTeams; //// this.teams is value for templates
          
            this.loadPartials({
                header: './templates/common/header.hbs',
                team: './templates/catalog/team.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function () {
                this.partial('./templates/catalog/teamCatalog.hbs'); //// load catalog with all teams
            });
            
        });

        this.get('#/create', function() {
            this.loggedIn = !!sessionStorage.getItem('username'); //// if is login will be true, else false
            this.username = sessionStorage.getItem('username'); //// get a name on user
            this.loadPartials({
                header: './templates/common/header.hbs',
                createForm: './templates/create/createForm.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function() {
                this.partial('./templates/create/createPage.hbs') //// load page for create new team
            });
        });

        this.post('#/create', function(context) {   //// create new team
            let that = this;
            let {name, comment} = context.params; //// get name and comment for the new team
            let data = {
                name,
                comment,
                members: [{username: sessionStorage.getItem('username')}],
                _acl: {creator: ''},
                teamId: sessionStorage.getItem('userId')
            }

            sessionStorage.hasTeam = !sessionStorage.getItem('hasTeam'); //// when user is created team. hasTeam is true, because he has already team
            requester.post('appdata', 'teams', authToken, data) //// make new team
                .then(function(res) {
                    sessionStorage.teamId = res._id;
                    auth.showInfo('Create Team Successfully'); //// show info for successfully
                    that.redirect('#/catalog'); //// go to catalog
                });
            
        });

        let currentTeam = '';
        this.get(`#/catalog/:${this._id}`, async function(context) { //// show info about the team
            this.loggedIn = !!sessionStorage.getItem('username');
            this.username = sessionStorage.getItem('username');
            let allTeams = await requester.get('appdata', `teams` , authToken);
            currentTeam = allTeams.find(x => x._id === context.params.undefined.slice(1)) //// show current team
            
            if(currentTeam._acl.creator === sessionStorage.getItem('userId')){ //// if creatorId = userId
                this.isAuthor = sessionStorage.getItem('isAuthor') //// this user is author; this will be true
                this.isOnTeam = sessionStorage.getItem('isOnTeam') //// automatic he is in the team
            } else {
                this.isAuthor = !sessionStorage.getItem('isAuthor') //// will be false if user is not the author on the team
                this.isOnTeam = !sessionStorage.getItem('isOnTeam') //// will be false also
            }

                                //// values for templates
            this.members = currentTeam.members;
            this.name = currentTeam.name;
            this.comment = currentTeam.comment;
            this.teamId = currentTeam._id;
            

            this.loadPartials({
                header: './templates/common/header.hbs',
                teamMember: './templates/catalog/teamMember.hbs',
                teamControls: './templates/catalog/teamControls.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function() {
                this.partial('./templates/catalog/details.hbs'); //// loag details for current team
            });
        });

        this.get(`#/join/:${this.teamId}`, function(context) {
            ////TODO
        });

        this.get(`#/edit/:${this.teamId}`, function() {
            this.loggedIn = !!sessionStorage.getItem('username'); //// with this we show Welcom, username
            this.username = sessionStorage.getItem('username');  //// if is true(login)

            this.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                editForm: './templates/edit/editForm.hbs'
            }).then(function() {
                this.partial('./templates/edit/editPage.hbs');
            });
        });

        this.post(`#/edit/:${this.teamId}`, function(context) { //// you can edit your team
            let that = this;
            let {name, comment} = context.params;
            requester.update('appdata', `teams/${currentTeam._id}`, authToken, {name, comment})
                .then(function(res) {
                    sessionStorage.teamId = res._id;
                    auth.showInfo('You Edit Team Info Successfully'); //// show info for successfully
                    that.redirect('#/catalog'); //// go to catalog
                });
        });

        this.get(`#/leave/:${this.teamId}`, function() {
            let that = this;
            requester.remove('appdata', `teams/${currentTeam._id}`, authToken)
                .then(function() {
                    that.redirect('#/catalog');
                });
        });

    });

    app.run('#/');
});