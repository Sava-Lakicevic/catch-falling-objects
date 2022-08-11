"use strict";

/**
 * The init function follows the Revealing Module pattern.
 * It creates a closure of certain variables, objects and functions, which are stored in Heap memory.
 * These objects exist in the Heap memory until all of the functions that call them are deleted.
 * The idea of the Revealing Module pattern is that all functioanlity should remain hidden.
 * Since JS doesn't have 'private' or 'public' variable specifiers, this is a JS solution to this problem.
 * */
function init() {
    // starting conditions for the game
    const startingConditions = {
        iconSpeed: 1,
        newIconInterval: 2000,
        binPosition: parseInt(window.getComputedStyle(bin).left),
    };

    // game object contains all of the important game elements and conditions
    const game = {
        main: document.getElementById("main"), //the main playing area
        bin: document.getElementById("bin"),
        mainWidth: parseInt(window.getComputedStyle(main).width),
        binWidth: parseInt(window.getComputedStyle(bin).width),
        iconWidth: 40, //from CSS styles
        mainHeight: parseInt(window.getComputedStyle(main).height),
        binHeight: parseInt(window.getComputedStyle(bin).height),
        iconHeight: 40, //from CSS styles
        binState: {
            binPosition: startingConditions.binPosition,
            binCanMove: false,
        },
        movementKeys: {
            left: ["a", "arrowleft"],
            right: ["d", "arrowright"],
        },
        settings: {
            binSpeed: 8,
            iconSpeed: startingConditions.iconSpeed, //initial speed for icon movement in pixels
            maxIconSpeed: 4, //max speed for icon movement in pixels
            newIconInterval: startingConditions.newIconInterval, //3 seconds
            minNewIconInterval: 500, //maximum frequency or lowest time interval
            widthCorrection: 20, //correction for checking if the icon is in the bin because of the icon width
            maxMistakesAllowed: 20,
        },
        score: 0,
        mistakes: 0,
        icons: ["angular", "css", "javascript", "react"], //all of the CSS classes based on the currently available icons
        levels: ["level1", "level2", "level3", "level4"], //all of the CSS classes based on the currently defined levels
        isActive: false,
    };

    // these elements display the current state of the game, such as current level, score and mistakes
    const displayElemts = {
        gameStartModal: document.getElementById("game-start-modal"),
        gameOverModal: document.getElementById("game-over-modal"),
        gameOverText: document.getElementById("game-over-text"),
        headerText: document.getElementById("header-text"),
        scoreWrapper: document.getElementById("score-and-mistakes-wrapper"),
        scoreText: document.getElementById("score"),
        mistakesText: document.getElementById("mistakes"),
    };

    // contains the IDS for requestAnimationFrame and setInterval
    const animationIDs = {
        binAnimationId: 0,
        iconAnimationId: 0,
        iconSetIntervalId: 0,
    };

    // bin shouldn't leave the main element
    const binMargins = {
        leftMargin: 0,
        rightMargin: game.mainWidth - game.binWidth,
    };

    // collision point determined
    const collisionPoint =
        game.mainHeight - game.binHeight - game.iconHeight + 10;

    // These margins determine if the icon is in the bin
    function getIconMargins() {
        const currentBinPosition = parseInt(
            window.getComputedStyle(game.bin).left
        );
        return {
            leftMargin: currentBinPosition - game.settings.widthCorrection,
            rightMargin:
                currentBinPosition +
                game.binWidth -
                game.settings.widthCorrection,
        };
    }

    let currentLevel = 1;

    function gameStart() {
        resetDisplayElements(displayElemts);
        setStartingConditions();
        setNewInterval();
    }
    function resetDisplayElements({
        gameStartModal,
        gameOverModal,
        scoreWrapper,
        headerText,
        scoreText,
        mistakesText,
    }) {
        // Hide the modals that do not need to be displayed
        gameStartModal.classList.add("hidden");
        gameOverModal.classList.add("hidden");
        // Uncover the score wrapper below the main element
        scoreWrapper.classList.remove("hidden");
        headerText.textContent = "Level 1";
        scoreText.textContent = 0;
        mistakesText.textContent = 0;
    }
    function setStartingConditions() {
        // reset the bin position to the middle
        game.bin.style.left = `${startingConditions.binPosition}px`;
        game.binState.binPosition = startingConditions.binPosition;
        // reset the speed and frequency of the icons
        game.settings.iconSpeed = startingConditions.iconSpeed;
        game.settings.newIconInterval = startingConditions.newIconInterval;
        // activate the game
        game.isActive = true;
        // reset the game status
        game.score = 0;
        game.mistakes = 0;
        currentLevel = 1;
        game.levels.forEach((level) => {
            game.main.classList.remove(level);
        });
        game.main.classList.add(game.levels[0]);
    }
    function gameOver() {
        // hide the score wrapper at the bottom of the page
        displayElemts.scoreWrapper.classList.add("hidden");
        // display the score and the reset button
        displayElemts.gameOverModal.classList.remove("hidden");
        displayElemts.gameOverText.innerHTML = `<br>Score: ${game.score}<br>`;
        displayElemts.headerText.textContent = "Game Over!";
        // stop the game and clear the interval
        game.binCanMove = false;
        game.isActive = false;
        clearInterval(animationIDs.iconSetIntervalId);
    }

    // generate new icon on a certain interval
    function newIcon() {
        const icon = document.createElement("div");
        icon.classList.add("icon", randomIcon());
        const iconLeftPosition = getRandomIconPosition();
        icon.style.left = `${iconLeftPosition}px`;
        game.main.appendChild(icon);
        animationIDs.iconAnimationId = requestAnimationFrame(() => {
            fallingIcon(icon, 0, iconLeftPosition);
        });
    }
    // get a random icon class from the icons array
    function randomIcon() {
        return game.icons[Math.trunc(Math.random() * 4)];
    }
    // get a random left position for the icon
    function getRandomIconPosition() {
        return Math.trunc(Math.random() * (game.mainWidth - game.iconWidth));
    }

    // animate the falling icon
    function fallingIcon(icon, iconTopPosition, iconLeftPosition) {
        //delete the icon if the game is over
        if (!game.isActive) {
            icon.remove();
        } else {
            iconTopPosition += game.settings.iconSpeed;
            icon.style.top = `${iconTopPosition}px`;
            // If you collide, remove the icon and check if it's in the bin
            if (iconTopPosition > collisionPoint) {
                icon.remove();
                if (isInBin(iconLeftPosition)) {
                    game.score += 1;
                    displayElemts.scoreText.textContent = game.score;
                    // level up every 10 successful catches
                    if (game.score % 10 === 0) {
                        levelUp();
                    }
                } else {
                    game.mistakes += 1;
                    displayElemts.mistakesText.textContent = game.mistakes;
                }
                // if we reach the max mistakes, game is over
                if (game.mistakes >= game.settings.maxMistakesAllowed) {
                    gameOver();
                }
            } else {
                // If you don't collide, continue animation
                animationIDs.iconAnimationId = requestAnimationFrame(() => {
                    fallingIcon(icon, iconTopPosition, iconLeftPosition);
                });
            }
        }
    }
    function isInBin(iconLeftPosition) {
        const { leftMargin, rightMargin } = getIconMargins();
        if (iconLeftPosition > leftMargin && iconLeftPosition < rightMargin) {
            return true;
        } else {
            return false;
        }
    }
    function levelUp() {
        if (currentLevel < game.levels.length) {
            // visual settings for each level
            game.main.classList.remove(game.levels[currentLevel - 1]);
            game.main.classList.add(game.levels[currentLevel]);
            currentLevel++;
            displayElemts.headerText.textContent = `Level ${currentLevel}`;
            // game settings for each level
            increaseSpeed();
            setNewInterval();
        }
    }
    // increase the speed and frequency of icons
    function increaseSpeed() {
        if (game.settings.iconSpeed >= game.settings.maxIconSpeed) {
            game.settings.iconSpeed = game.settings.maxIconSpeed;
        } else {
            game.settings.iconSpeed++;
        }
        game.settings.newIconInterval *= 0.5;
        if (game.settings.newIconInterval < game.settings.minNewIconInterval) {
            game.settings.newIconInterval = game.settings.minNewIconInterval;
        }
    }
    // After we increase the frequency, we need to cancel the old interval and start a new one
    function setNewInterval() {
        clearInterval(animationIDs.iconSetIntervalId);
        animationIDs.iconSetIntervalId = setInterval(
            newIcon,
            game.settings.newIconInterval
        );
    }
    // MoveLeftFlag determines if the bin is moving left or right
    function moveBin(moveLeftFlag) {
        if (game.binState.binCanMove) {
            if (moveLeftFlag) {
                game.binState.binPosition -= game.settings.binSpeed;
                if (game.binState.binPosition < binMargins.leftMargin) {
                    game.binState.binPosition = binMargins.leftMargin;
                    game.binState.binCanMove = false;
                }
            } else {
                game.binState.binPosition += game.settings.binSpeed;
                if (game.binState.binPosition > binMargins.rightMargin) {
                    game.binState.binPosition = binMargins.rightMargin;
                    game.binState.binCanMove = false;
                }
            }
            game.bin.style.left = `${game.binState.binPosition}px`;
            animationIDs.binAnimationId = requestAnimationFrame(() => {
                moveBin(moveLeftFlag);
            });
        } else {
            cancelAnimationFrame(animationIDs.binAnimationId);
        }
    }

    // Handle key-down events and move the bin if conditions apply
    function moveBinHandler(e) {
        const key = e.key.toLowerCase();
        if (approveMovement(key) && game.isActive) {
            // Move left if true, move right if false
            animationIDs.binAnimationId = requestAnimationFrame(() => {
                moveBin(game.movementKeys.left.includes(key));
            });
        }
    }
    function approveMovement(key) {
        if (
            game.movementKeys.left.includes(key) &&
            game.binState.binPosition !== binMargins.leftMargin
        ) {
            game.binState.binCanMove = true;
            return true;
        }
        if (
            game.movementKeys.right.includes(key) &&
            game.binState.binPosition !== binMargins.rightMargin
        ) {
            game.binState.binCanMove = true;
            return true;
        }
        return false;
    }
    // Handle key-up events to stop the bin from moving
    function stopBinHandler(e) {
        const key = e.key.toLowerCase();
        if (
            game.movementKeys.left.includes(key) ||
            game.movementKeys.right.includes(key)
        ) {
            game.binState.binCanMove = false;
            cancelAnimationFrame(animationIDs.binAnimationId);
        }
    }
    /**
     * Cancel the interval when on another tab or browser is minimized.
     * This is done, because requestAnimationFrame will automatically pause when tabbed out.
     * setInterval doesn't stop; hence we need to handle that ourselves.
     */
    function visibilityChangeHandler() {
        if (document.visibilityState === "hidden") {
            console.log("HIDDEN");
            clearInterval(animationIDs.iconSetIntervalId);
        } else if (game.isActive) {
            console.log("VISIBLE");
            setNewInterval();
        }
    }
    // Return only the necessary functions
    return {
        gameStart: gameStart,
        moveBinHandler: moveBinHandler,
        stopBinHandler: stopBinHandler,
        visibilityChangeHandler: visibilityChangeHandler,
    };
}

const game = init();

document.getElementById("btn-start").addEventListener("click", game.gameStart);
document
    .getElementById("btn-restart")
    .addEventListener("click", game.gameStart);
document.addEventListener("keydown", game.moveBinHandler);
document.addEventListener("keyup", game.stopBinHandler);
document.addEventListener("visibilitychange", game.visibilityChangeHandler);
