angular.module('hanabi.controllers', ['ionic'])

.controller('DashCtrl', function($scope, $state, $ionicModal, $ionicPopup, $ionicActionSheet, $timeout, gameService) {

    $scope.loginError = '';
    $scope.logged = false;

    $scope.loginData = {
        server: '',
        username: '',
        password: '',
    };

    // Declaring modals
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope,
        animation: 'slide-in-up'
    })

    .then(function(modal) {
        $scope.loginModal = modal;
        modal.show();
    });

    $ionicModal.fromTemplateUrl('templates/board.html', {
        scope: $scope,
        animation: 'slide-in-up'
    })

    .then(function(modal) {
        $scope.boardModal = modal;
    });

    $scope.keyInput = function($event) {
        if ($event.keyCode === 13) {
            $scope.signIn();
        };
    };

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
                $scope.showNextAlert = false;

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

                socket.on('played', function(color) {
                    $scope.gameData.found[color] ++;
                    $state.reload();
                });

                socket.on('discarded', function(card) {
                    $scope.gameData.discarded.push(card);
                    $state.reload();
                });

                socket.on('info', function(str) {
                    if (str === 'add') {
                        $scope.gameData.informations ++;
                    } else {
                        $scope.gameData.informations --;
                    }
                    $state.reload();
                });

                socket.on('warning', function(data) {
                    $scope.gameData.warnings ++;
                    $state.reload();
                    $scope.showAlert('Warning: ' + data.pseudo + ' attempted to play the ' + data.card.color + ' ' + data.card.number);
                });

                socket.on('next_turn', function(data) {
                    $scope.showAlert('New Turn', data.lastPlay + '\n - \n' + data.playerUp + " is up!"); // bugs, duunno why
                    $scope.gameData.nextToPlay = data.playerUp;
                    $scope.gameData.lastPlay = data.lastPlay;
                    $state.reload();
                });

                socket.on('game_end', function(message) {
                    $scope.showAlert('Game Finished', message);
                });

                $scope.lastReorder = {};
                $scope.reorder = function() {

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
                    if ($scope.showNextAlert) {
                        var alertPopop = $ionicPopup.show({
                            title: title, // String. The title of the popup.
                            cssClass: '', // String, The custom CSS class name
                            template: message, // String (optional). The html template to place in the popup body.
                            buttons: [{
                                text: 'OK',
                                type: 'button-outline button-positive',
                                onTap: function(e) {
                                    $state.reload();
                                }
                            }]
                        });
                    } else {
                        $scope.showNextAlert = true;
                    }
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

                // Triggered by a click on info button
                $scope.inform = function() {

                    // Aux function to call after info type is chosen
                    inform3 = function(player, type) {
                        var buttons3
                        if (type === 'number') {
                            buttons3 = [
                                { text: '1' },
                                { text: '2' },
                                { text: '3' },
                                { text: '4' },
                                { text: '5' },
                                { text: 'Cancel <i class="icon ion-ios-close-outline"></i>' },
                            ];
                        } else if (type === 'color') {
                            buttons3 = [
                                { text: 'Black' },
                                { text: 'Red' },
                                { text: 'Blue' },
                                { text: 'Green' },
                                { text: 'Yellow' },
                            ];
                            if (!$scope.gameData.hardMode) {
                                buttons3.push({ text: 'Multicolor' })
                            };
                            buttons3.push({ text: 'Cancel <i class="icon ion-ios-close-outline"></i>' });
                        };

                        var hideSheet3 = $ionicActionSheet.show({
                            buttons: buttons3,
                            titleText: 'Choose an information:',
                            buttonClicked: function(i) {
                                if (i < buttons3.length - 1) {
                                    var info = buttons3[i].text.toLowerCase();
                                    socket.emit('infoRequest', {player: player, info: info});
                                };
                                return true;
                            }
                        });

                        $timeout(function() {
                            hideSheet3();
                        }, 5000);
                    };

                    // Aux. function when to use when player is chosen
                    inform2 = function(player) {

                        var hideSheet2 = $ionicActionSheet.show({
                            buttons: [
                                { text: 'Number' },
                                { text: 'Color' },
                                { text: 'Cancel <i class="icon ion-ios-close-outline"></i>' },
                            ],
                            titleText: 'Choose an action type:',
                            buttonClicked: function(i) {
                                switch (i) {
                                    case 0:
                                        inform3(player, 'number');
                                        break;
                                    case 1:
                                        inform3(player, 'color');
                                        break;
                                    default:
                                        break;
                                };
                                return true;
                            }
                        });

                        $timeout(function() {
                            hideSheet2();
                        }, 5000);

                    };

                    // Show the player selection if needed
                    if ($scope.gameData.colleagues.length === 1) {
                        inform2($scope.gameData.colleagues[0]);
                    } else {

                        var buttons = [];
                        $scope.gameData.colleagues.forEach(function(player) {
                            buttons.push({ text: player })
                        });

                        buttons.push({ text: 'Cancel <i class="icon ion-ios-close-outline"></i>' });

                        var hideSheet1 = $ionicActionSheet.show({
                            buttons: buttons,
                            titleText: 'Who de you want to inform?',
                            buttonClicked: function(i) {
                                if (i != $scope.gameData.colleagues.length) {
                                    inform2($scope.gameData.colleagues[i]);
                                };
                                return true;
                            }
                        });

                        $timeout(function() {
                            hideSheet1();
                        }, 5000);

                    }

                }; // End info selection

            }); // EO socket.on('init')
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
