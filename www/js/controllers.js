angular.module('hanabi.controllers', [])

.controller('DashCtrl', function($scope, $state, $ionicModal, gameService) {

    $scope.loginError = '';
    $scope.logged = false;

    $scope.loginData = {
        server: '',
        username: '',
        password: '',
    };

    // Show the login slide view if needed
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope,
        animation: 'slide-in-up'
    })

    .then(function(modal) {
        $scope.loginModal = modal;
        modal.show();
    });

    $scope.signIn = function() {
        console.log($scope.loginData);

        var socket = io.connect('http://' + $scope.loginData.server);
        socket.emit('nouveau_client', $scope.loginData.username);

        socket.on('reject_login', function() {
            $scope.loginError = 'Wrong username';
            $state.reload();
            console.log('Wrong username');
        });

        socket.on('pseudo_ok', function() {
            socket.emit('login', $scope.loginData.password);

            socket.on('reject_pwd', function() {
                $scope.loginError = 'Wrong Password';
                $state.reload();
                console.log('Wrong password');
            });

            socket.on('init', function(gameData) {
                $scope.logged = true;
                gameData.colleagues = [];
                for (var p in gameData.hands) {
                    gameData.hands[p].reverse();
                    gameData.colleagues.push(p);
                };
                gameService.set(gameData);
                console.log(gameData);
                $scope.gameData = gameData;
                $scope.loginModal.hide();

                socket.on('redraw', function(data) {
                    data.hand.reverse();
                    $scope.gameData.hands[data.pseudo] = data.hand;
                    gameService.set(scope.gameData);
                    $state.reload();
                });

            });
        });
    }
})

.controller('ChatsCtrl', function($scope) {

})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
    $scope.settings = {
        enableFriends: true
    };
});
