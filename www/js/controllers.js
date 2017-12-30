angular.module('hanabi.controllers', ['ionic'])

.controller('DashCtrl', function($scope, $state, $ionicModal, $ionicPopup, $ionicActionSheet, $timeout, gameService) {

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
                    gameData.your_cards_angles[i] = {angle: gameData.your_cards_angles[i], index: i, noCard: gameData.your_cards_angles[i] === -1};
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

                socket.on('redraw_mine', function(data) {
                    $scope.gameData.your_cards_angles = data;
                    for (var i = 0; i < $scope.gameData.your_cards_angles.length; i++) {
                        $scope.gameData.your_cards_angles[i] = {angle: data[i], index: i, noCard: gameData.your_cards_angles[i] === -1};
                    };
                    gameService.set($scope.gameData);
                    $state.reload();
                });

                socket.on('notify', function(message) {
                    $scope.showAlert('Notification', message);
                });

/*
                socket.on('next_turn', function(data) {
                    $scope.showAlert('New Turn', data.lastPlay + '\n - \n' + data.playerUp + " is up!");
                });
*/

                socket.on('game_end', function(message) {
                    $scope.showAlert('Game Finished', message);
                });

                $scope.reorder = function() {

                    $scope.lastReorder = {};

                    var myPopup = $ionicPopup.show({
                        template: '<input type="order" ng-model="lastReorder.data">',
                        title: 'Choose a new order (ex. 14325):',
                        scope: $scope,
                        buttons: [
                            { text: 'Cancel' },
                            {
                                text: '<b>Send</b>',
                                type: 'button-positive',
                                onTap: function(e) {
                                    if (!$scope.lastReorder.data) {
                                        e.preventDefault();
                                    } else {
                                        return $scope.lastReorder.data;
                                    }
                                }
                            }
                        ]
                    })

                    .then(function(res) {
                        if (res) socket.emit('reorderRequest', res);
                    });

                };

                $scope.showAlert = function(title, message) {
                    var alertPopup = $ionicPopup.alert({
                        title: title,
                        template: message
                    });
                };

                // Triggered on a click on a card
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
