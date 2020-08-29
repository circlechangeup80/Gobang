function Gobang(rows = BOARD_WID, cols = BOARD_WID) {
    this.rows = rows;
    this.cols = cols;
    this.boardDOM = document.getElementById("chessboard");
    this.pieceDOM = document.getElementById("piece");
    this.restartButton = document.getElementById("restart");
    this.undoButton = document.getElementById("undo");
    this.switchButton = document.getElementById("switch");
    this.selectBox = document.getElementById("selectbox");
    this.records = []

    this.init = function() {
        if (this.boardDOM.getContext) {
            this.boardCanvasCtx = this.boardDOM.getContext('2d');
            console.log('Board canvas context is loaded successfully!');
        } else {
            console.log('Get board canvas context error!');
            return false;
        }
        if (this.pieceDOM.getContext) {
            this.pieceCanvasCtx = this.pieceDOM.getContext('2d');
            console.log('Piece canvas context is loaded successfully!');
        } else {
            console.log('Get piece canvas context error!');
            return false;
        }

        this.boardWidth = parseInt(this.boardDOM.width);
        this.boardHeight = parseInt(this.boardDOM.height);

        this.gridLen = this.boardWidth / (this.rows + 1);
        this.borderLen = this.gridLen;

        gb = this;

        this.gameImgs = [];
        var bgImg = new Image();
        var blackpiece = new Image();
        var whitepiece = new Image();
        this.gameImgs.push(bgImg);
        this.gameImgs.push(blackpiece);
        this.gameImgs.push(whitepiece);
        this.loadImgCnt = this.gameImgs.length;
        for (let i = 0; i < this.gameImgs.length; i++) {
            gb.gameImgs[i].onload = function() {
                if (--gb.loadImgCnt == 0) {
                    gb.finishImgLoadCb();
                }
            }
        }

        bgImg.src = 'img_source/woodbg.jpeg';
        blackpiece.src = 'img_source/blackPiece.png';
        whitepiece.src = 'img_source/whitePiece.png';

        this.gbEngine = new GB.GobangEngine();
        this.gbEngine.init();
        this.gameState = ONGOING;
        this.createHoverCanvas();

        return true;
    }

    this.finishImgLoadCb = function() {
        console.log("All images are loaded");
        /* Draw the background */
        this.boardCanvasCtx.drawImage(this.gameImgs[0], 0, 0);
        this.drawLine();
        this.drawDots();
        this.drawText();
        console.log('Background is drawn');
    }

    this.drawLine = function() {
        let ctx = this.boardCanvasCtx;
        ctx.strokeStyle = 'black';
        
        ctx.beginPath();
        for (let i = 0; i < this.rows; i++) {
            ctx.moveTo(this.borderLen, this.borderLen + i * this.gridLen);
            ctx.lineTo(this.boardWidth - this.borderLen, this.borderLen + i * this.gridLen);
            ctx.stroke();
            ctx.moveTo(this.borderLen + i * this.gridLen, this.borderLen);
            ctx.lineTo(this.borderLen + i * this.gridLen, this.boardHeight - this.borderLen);
        }
        ctx.closePath();
        ctx.stroke();
    }

    this.drawDots = function() {
        let ctx = this.boardCanvasCtx;
        let dotRadius = 3;
        let locs = [[3, 3], [3, 7], [3, 11],
                    [7, 3], [7, 7], [7, 11],
                    [11,3], [11,7], [11,11]];

        function getCanvasCoord(gobangObj, gridCoord, offset) {
            return gridCoord * gobangObj.gridLen + gobangObj.borderLen - offset;
        }

        for (let i = 0; i < locs.length; i++) {
            loc = locs[i];
            ctx.fillRect(getCanvasCoord(this, loc[0], dotRadius),
                         getCanvasCoord(this, loc[1], dotRadius),
                         dotRadius << 1,
                         dotRadius << 1);
        }
    }

    this.drawText = function() {
        let ctx = this.boardCanvasCtx;
        let letterText = "A";
        let number = 1;
        let offset = 5;
        let halfGridLen = this.gridLen / 2;

        ctx.font = "15px Arial";
        ctx.textAlign = "center";
        
        for (let i = 0; i < this.cols; i++) {
            let x = this.borderLen + this.gridLen * i;
            let y = this.borderLen + this.gridLen * this.rows - halfGridLen + offset;
            ctx.fillText(letterText, x, y, this.gridLen);
            letterText = nextChar(letterText);
        }

        for (let i = 0; i < this.rows; i++) {
            let x = this.borderLen + this.gridLen * this.cols - halfGridLen;
            let y = this.borderLen + this.gridLen * i + offset;
            let numberText = number.toString();

            ctx.fillText(numberText, x, y, this.gridLen);
            number++;
        }

        function nextChar(c) {
            return String.fromCharCode(c.charCodeAt(0) + 1);
        }
    }

    this.drawPiece = function(x, y, piece) {
        let ctx = this.pieceCanvasCtx;
        ctx.drawImage(this.gameImgs[piece], 18 + y * 36, 18 + x * 36, 36, 36);
    }

    this.clearPiece = function(x, y) {
        let ctx = this.pieceCanvasCtx;
        ctx.clearRect(18 + y * 36, 18 + x * 36, 36, 36);
    }

    this.clearHoverFocus = function() {
        this.hoverCanvasCtx.clearRect(0, 0, this.hoverCanvasDOM.width, this.hoverCanvasDOM.height);
    }

    this.drawHoverFocus = function(x, y) {
        this.clearHoverFocus();

        function getCanvasCoord(gobangObj, gridCoord) {
            return gridCoord * gobangObj.gridLen + gobangObj.borderLen / 2;
        }

        this.hoverCanvasCtx.beginPath();
        this.hoverCanvasCtx.fillStyle = '#000000';
        this.hoverCanvasCtx.strokeStyle = 'red';
        this.hoverCanvasCtx.rect(getCanvasCoord(this, x),
                                 getCanvasCoord(this, y),
                                 this.gridLen,
                                 this.gridLen);
        this.hoverCanvasCtx.closePath();
        this.hoverCanvasCtx.stroke();
    }


    this.addRecord = function(x, y) {
        function pos2recordText(x, y) {
            return (gb.records.length + 1) +
                   ". " +
                   String.fromCharCode(65 + y) +
                   (x + 1);
        }

        let h3 = document.createElement('h3');
        let recBoard = document.getElementById('recordboard');

        h3.textContent = pos2recordText(x, y);
        h3.style.font = "italic bold 16px arial,serif";
        if (gb.records.length % 2 == 0) {
            h3.style.color = "black";
        } else {
            h3.style.color = "white";
        }
        gb.records.push(h3);
        recBoard.appendChild(h3);
        recBoard.scrollTop = recBoard.scrollHeight;
    }

    this.addGameOverMsg = function(msg) {
        let h3 = document.createElement('h3');
        let recBoard = document.getElementById('recordboard');
        h3.textContent = msg;
        h3.style.font = "italic 20px fantasy";
        h3.style.color = "red";
        gb.records.push(h3);
        recBoard.appendChild(h3);
        recBoard.scrollTop = recBoard.scrollHeight;
    }

    this.rmLastRecord = function() {
        if (gb.records.length > 0) {
            let h3 = gb.records.pop();
            document.getElementById('recordboard').removeChild(h3);
        }
    }

    this.rmAllRecords = function() {
        while (gb.records.length > 0) {
            let h3 = gb.records.pop();
            document.getElementById('recordboard').removeChild(h3);
        }
    }

    this.createHoverCanvas = function() {
        this.hoverCanvasDOM = document.createElement('canvas');
        this.hoverCanvasDOM.width = this.boardWidth;
        this.hoverCanvasDOM.height = this.boardHeight;
        this.hoverCanvasDOM.style.position = 'absolute';
        this.hoverCanvasDOM.style.top = '8px';
        this.hoverCanvasDOM.style.left = '8px';
        this.hoverCanvasCtx = this.hoverCanvasDOM.getContext('2d');
        document.getElementById('interface').appendChild(this.hoverCanvasDOM);

        gbEngine = this.gbEngine;
        var mouseOnBoard = false;

        this.hoverCanvasDOM.onclick = function(e) {
            if (mouseOnBoard && gb.gameState == ONGOING) {
                if (e.offsetX > gb.borderLen/2 &&
                    e.offsetX < (gb.boardWidth - gb.borderLen/2) &&
                    e.offsetY > gb.borderLen/2 &&
                    e.offsetY < (gb.boardHeight - gb.borderLen/2)) {
                    let x = Math.floor((e.offsetY - (gb.borderLen/2))/gb.gridLen);
                    let y = Math.floor((e.offsetX - (gb.borderLen/2))/gb.gridLen);

                    if (gbEngine.playerMove(x, y)) {
                        console.log("player put piece at (%d, %d)", x, y);
                        let piece = gbEngine.role2PieceType(HUMAN);
                        gb.drawPiece(x, y, piece);
                        gb.addRecord(x, y);
                        if (gbEngine.isWinMove(x, y, HUMAN)) {
                            gb.gameState = GAMEOVER;
                            gb.clearHoverFocus();
                            gb.addGameOverMsg("You win!!!");
                        } else {
                            setTimeout(function() {
                                let pos = gbEngine.aiMove();
                                console.log("AI put piece at (%d, %d)", pos.x, pos.y);
                                let piece = gbEngine.role2PieceType(COMPUTER);
                                gb.drawPiece(pos.x, pos.y, piece);
                                gb.addRecord(pos.x, pos.y);

                                if (gbEngine.isWinMove(pos.x, pos.y, COMPUTER)) {
                                    gb.gameState = GAMEOVER;
                                    gb.clearHoverFocus();
                                    gb.addGameOverMsg("You lose!!!");
                                }
                            }, 20);
                        }
                    }
                }
            }
        }

        this.hoverCanvasDOM.addEventListener('mouseover', function(e) {
            mouseOnBoard = true;
        });

        this.hoverCanvasDOM.addEventListener('mouseout', function(e) {
            mouseOnBoard = false;
            gb.clearHoverFocus();
        });

        this.hoverCanvasDOM.addEventListener('mousemove', function(e) {
            if (mouseOnBoard && gb.gameState == ONGOING) {
                if (e.offsetX > gb.borderLen/2 &&
                    e.offsetX < (gb.boardWidth - gb.borderLen/2) &&
                    e.offsetY > gb.borderLen/2 &&
                    e.offsetY < (gb.boardHeight - gb.borderLen/2)) {
                    let x = Math.floor((e.offsetX - (gb.borderLen/2))/gb.gridLen);
                    let y = Math.floor((e.offsetY - (gb.borderLen/2))/gb.gridLen);
                    gb.drawHoverFocus(x, y);
                }
            }
        });

        this.restartButton.addEventListener('click', function() {
            let ctx = gb.pieceCanvasCtx;

            ctx.clearRect(0, 0, 576, 576);
            gb.rmAllRecords();
            gbEngine.reset();
            gb.gameState = ONGOING;

            pos = gbEngine.start();
            if (pos != null) {
                let piece = gbEngine.role2PieceType(COMPUTER);
                gb.drawPiece(pos.x, pos.y, piece);
                gb.addRecord(pos.x, pos.y); 
            }
        });

        this.undoButton.addEventListener('click', function() {
            if (gb.gameState == ONGOING) {
                let posPair = gbEngine.undoMoves();
                if (posPair != null) {
                    gb.clearPiece(posPair[0].x, posPair[0].y);
                    gb.rmLastRecord();
                    gb.clearPiece(posPair[1].x, posPair[1].y);
                    gb.rmLastRecord();
                }
            }
        });

        this.switchButton.addEventListener('click', function() {
            let tmp = document.getElementById("playerPiece").src;
            document.getElementById("playerPiece").src = document.getElementById("aiPiece").src;
            document.getElementById("aiPiece").src = tmp;
            gbEngine.switchPlayerAI();

            if (gb.gameState == ONGOING) {
                let pos = gbEngine.aiMove();
                console.log("AI put piece at (%d, %d)", pos.x, pos.y);
                let piece = gbEngine.role2PieceType(COMPUTER);
                gb.drawPiece(pos.x, pos.y, piece);
                gb.addRecord(pos.x, pos.y); 
                if (gbEngine.isWinMove(pos.x, pos.y)) {
                    gb.gameState = GAMEOVER;
                    gb.clearHoverFocus();
                }
            }
        });

        this.selectBox.addEventListener('click', function() {
            let inputEasy = document.getElementById("easy");
            let inputMedium = document.getElementById("medium");
            let inputHard = document.getElementById("hard");

            if (inputEasy.checked) {
                gbEngine.setLevel(LEVEL.EASY);
            } else if(inputMedium.checked) {
                gbEngine.setLevel(LEVEL.MEDIUM);
            } else if(inputHard.checked) {
                gbEngine.setLevel(LEVEL.HARD);
            }
        });
    }
}
