angular.module('hanabi.controllers', ['ionic'])

.controller('DashCtrl', function($scope, $state, $ionicModal, $ionicActionSheet, $timeout, gameService) {

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
                for (var i = 0; i < gameData.your_cards_angles.length; i++) {
                    gameData.your_cards_angles[i] = {angle: gameData.your_cards_angles[i], index: i}
                };
                gameService.set(gameData);
                console.log(gameData);
                $scope.gameData = gameData;
                $scope.loginModal.hide();

                socket.on('redraw', function(data) {
                    data.hand.reverse();
                    $scope.gameData.hands[data.pseudo] = data.hand;
                    gameService.set($scope.gameData);
                    $state.reload();
                });

                // Triggered on a button click, or some other target
                $scope.actionCard = function(index) {

                    // Show the action sheet
                    var hideSheet = $ionicActionSheet.show({
                        buttons: [
                            { text: 'Play <i class="icon ion-ios-game-controller-a-outline"></i>' },
                            { text: 'Discard <i class="icon ion-ios-trash-outline"></i>' },
                            { text: 'Rotate Left <i class="icon ion-ios-undo-outline"></i>' },
                            { text: 'Rotate Right <i class="icon ion-ios-redo-outline"></i>' },
                            { text: 'Cancel <i class="icon ion-ios-close-outline"></i>' }
                        ],
                        titleText: 'Action with your ' + ['1st', '2nd', '3rd', '4th', '5th'][index] + ' card:',
                        buttonClicked: function(i) {
                            switch (i) {
                                // Play
                                case 0:
                                    socket.emit('playRequest', String(index));
                                    break;
                                // Discard
                                case 1:
                                    socket.emit('discardRequest', String(index));
                                    break;
                                // Rotate Left
                                case 2:
                                    socket.emit('rotateRequest', {id: index, angle: 90});
                                    break;
                                // Rotate Right
                                case 3:
                                    socket.emit('rotateRequest', {id: index, angle: -90});
                                    break;
                                default:
                                    break;
                            }
                            return true;
                        }
                    });

                    // For example's sake, hide the sheet after two seconds
                    $timeout(function() {
                        hideSheet();
                    }, 5000);

                };

            });
        });
    }
})

.controller('ChatsCtrl', function($scope) {

})

.controller('AccountCtrl', function($scope) {
    $scope.settings = {
        enableFriends: true
    };
});
