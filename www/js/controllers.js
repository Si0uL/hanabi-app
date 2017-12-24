angular.module('hanabi.controllers', [])

.controller('DashCtrl', function($scope, $ionicModal) {

    $scope.loginData = {
        server: '',
        username: '',
        password: '',
    }

    // define create account view
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
            console.log('Wrong username');
        });

        socket.on('pseudo_ok', function() {
            socket.emit('login', $scope.loginData.password);

            socket.on('reject_pwd', function() {
                console.log('Wrong Password');
            });

            socket.on('init', function(gameData) {
                $scope.loginModal.hide();
                console.log(gameData);
            });
        });
    }
})

.controller('ChatsCtrl', function($scope, Chats) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.chats = Chats.all();
    $scope.remove = function(chat) {
        Chats.remove(chat);
    };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
    $scope.settings = {
        enableFriends: true
    };
});
