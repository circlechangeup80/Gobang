var GB = (function() {
    const patterns = [
        "11111",  /* score: WIN_SCORE */
        "011110", /* score: 4320      */
        "011100", /* score: 720       */
        "001110", /* score: 720       */
        "011010", /* score: 720       */
        "010110", /* score: 720       */
        "11110",  /* score: 720       */
        "01111",  /* score: 720       */
        "11011",  /* score: 720       */
        "10111",  /* score: 720       */
        "11101",  /* score: 720       */
        "001100", /* score: 120       */
        "001010", /* score: 120       */
        "010100", /* score: 120       */
        "000100", /* score: 20        */
        "001000"  /* score: 20        */
    ].map(x => x.split(""));

    const patternScores = [
        WIN_SCORE, /* pattern: "11111"  */
        4320,      /* pattern: "011110" */
        720,       /* pattern: "011100" */
        720,       /* pattern: "001110" */
        720,       /* pattern: "011010" */
        720,       /* pattern: "010110" */
        720,       /* pattern: "11110"  */
        720,       /* pattern: "01111"  */
        720,       /* pattern: "11011"  */
        720,       /* pattern: "10111"  */
        720,       /* pattern: "11101"  */
        120,       /* pattern: "001100" */
        120,       /* pattern: "001010" */
        120,       /* pattern: "010100" */
        20,        /* pattern: "000100" */
        20         /* pattern: "001000" */
    ];

    function Position(x, y) {
        this.updatePos(x, y);
        this.key = 0; /* score at this position */
    }

    Position.prototype.updatePos = function(x, y) {
        this.x = x;
        this.y = y;
        this.idx = (this.x << PADDED_BOARD_WID_SHT) + this.y;
    }

    Position.prototype.setScore = function(score) {
        this.key = score;
    }

    function PossiblePosManager() {
        this.curPossiblePosSet = new Set();
        this.addPosSetHist = [];
        this.rmPosHist = [];
    }

    PossiblePosManager.prototype.addPossiblePos = function(board, pos) {
        let addPosSet = new Set();
        let posIdx = toidx(pos.x, pos.y);
        let rmPos;

        for (let dir = 0; dir < DIRECTIONS.length; dir++) {
            let nearx = pos.x + DIRECTIONS[dir][0];
            let neary = pos.y + DIRECTIONS[dir][1];
            let idx = toidx(nearx, neary);

            if (inboard(nearx, neary) && board[idx] == NONE && !this.curPossiblePosSet.has(idx)) {
                this.curPossiblePosSet.add(idx);
                addPosSet.add(idx);
            }
        }

        if (this.curPossiblePosSet.has(posIdx)) {
            this.curPossiblePosSet.delete(posIdx);
            rmPos = posIdx;
        } else {
            rmPos = null;
        }

        this.addPosSetHist.push(addPosSet);
        this.rmPosHist.push(rmPos);
    }

    PossiblePosManager.prototype.rollback = function(board, pos) {
        if (this.addPosSetHist.length > 0) {
            let addedPos = this.addPosSetHist.pop();
            let removePos = this.rmPosHist.pop();
            
            for (let pos of addedPos) {
                this.curPossiblePosSet.delete(pos);
            }
            if (removePos != null) {
                this.curPossiblePosSet.add(removePos);
            }
        }
    }

    PossiblePosManager.prototype.getCurPossiblePosSet = function(board, pos) {
        return this.curPossiblePosSet; 
    }
        
    PossiblePosManager.prototype.removeAll = function(board, pos) {
        this.curPossiblePosSet.clear(); 
        this.addPosSetHist = [];
        this.rmPosHist = [];
    }

    function GobangEngine() {
        this.level = LEVEL.MEDIUM;
        this.winner = -1;
        this.moves = [];
        let boardSize = PADDED_BOARD_WID * PADDED_BOARD_WID;
        this.board = Array(boardSize).fill(0);
        this.possiblePosMan = new PossiblePosManager();
        this.tp = new TP.ZobristHash();

        this.totalScore = [0, 0];
        this.lineScores = [Array(BOARD_WID * 6).fill(0), Array(BOARD_WID * 6).fill(0)];

        this.roleMap = [BLACK, WHITE];
        this.aiPos = new Position(-1, -1);
    }

    GobangEngine.prototype.isWinMove = function(x, y, role) {
        let ext = [0, 0, 0, 0, 0, 0, 0, 0];

        /* check the vertical line, horizontal line, / line and \ line */
        for (let i = 0; i < DIRECTIONS.length; i += 2) {
            for (let j = i; j < i + 2; j++) {
                let tmp_x = x;
                let tmp_y = y;
                while (true) {
                    /* extend along the direction */
                    tmp_x += DIRECTIONS[j][0];
                    tmp_y += DIRECTIONS[j][1];
                    if (tmp_x >= 0 && tmp_x < BOARD_WID && tmp_y >= 0 && tmp_y < BOARD_WID) {
                        if (this.board[toidx(tmp_x, tmp_y)] == this.roleMap[role]) ext[j]++; 
                        else break;
                    } else {
                        break;
                    }
                    if (ext[j] == 5) return true;
                }
            }
            if (ext[i] + ext[i + 1] + 1 >= 5) return true; 
        }
        return false;
    }

    GobangEngine.prototype.updateState = function(pos, role) {
        this.tp.update(this.roleMap[role] - 1, pos.x, pos.y);
        this.updateScore(pos);
    }

    GobangEngine.prototype._pushPieceCharToArr = function(line_arr, dir_idx, x, y) {
        if (this.board[toidx(x, y)] == NONE) {
            line_arr[0][dir_idx].push('0');
            line_arr[1][dir_idx].push('0');
        } else if (this.board[toidx(x, y)] == BLACK) {
            line_arr[0][dir_idx].push('1');
            line_arr[1][dir_idx].push('2');
        } else if (this.board[toidx(x, y)] == WHITE) {
            line_arr[0][dir_idx].push('2');
            line_arr[1][dir_idx].push('1');
        } else if (this.board[toidx(x, y)] == TRYING) {
            line_arr[0][dir_idx].push('1');
            line_arr[1][dir_idx].push('1');
        }
    }

    GobangEngine.prototype._buildDirsCharArr = function(line_arr, start_x, start_y, end_x, end_y, dirs) {
        for (let i = 0; i < dirs.length; i++) {
            let tmp_x = start_x[i];
            let tmp_y = start_y[i];
            for (; tmp_x <= end_x[i] && tmp_y <= end_y[i] && tmp_x >= 0;
                 tmp_x += dirs[i][0], tmp_y += dirs[i][1]) {
                this._pushPieceCharToArr(line_arr, i, tmp_x, tmp_y);
            }
        }
    }

    GobangEngine.prototype.updateScore = function(pos) {
        let x = pos.x;
        let y = pos.y;
        let line_arr = [[[], [], [], []], [[], [], [], []]];
        let index = [y, x + BOARD_WID, y - x + BOARD_WID + (BOARD_WID << 1), y + x + (BOARD_WID << 2)];
        let start_x = [0, x, x - Math.min(x, y), x + Math.min(y, BOARD_WID - 1 - x)];
        let start_y = [y, 0, y - Math.min(x, y), y - Math.min(y, BOARD_WID - 1 - x)];
        let end_x = [BOARD_WID - 1, x, BOARD_WID - 1 - start_y[2], BOARD_WID - 1];
        let end_y = [y, BOARD_WID - 1, BOARD_WID - 1, start_x[3]];
        let dirs = [DIRECTIONS[1], DIRECTIONS[3], DIRECTIONS[5], DIRECTIONS[7]];
        let diff;

        /* Store char array of four directions: vertical, horizontal, \ and / to line_arr */
        this._buildDirsCharArr(line_arr, start_x, start_y, end_x, end_y, dirs);

        for (let piece = 0; piece < 2; piece++) {
            for (let i = 0; i < 4; i++) {
                if (line_arr[piece][i].length != 0) {
                    let newScore = 0;
                    let searchResult = this.ACSearcher.search(line_arr[piece][i]);

                    for (let j = 0; j < searchResult.length; j++) {
                        newScore += patternScores[searchResult[j]];
                    }

                    diff = newScore - this.lineScores[piece][index[i]];
                    this.totalScore[piece] += diff;
                    this.lineScores[piece][index[i]] = newScore;
                } else {
                    console.log("no score update");
                }
            }
        }
    }

    GobangEngine.prototype.calcFwPosScore = function(pos) {
        let x = pos.x;
        let y = pos.y;
        let line_arr = [[[], [], [], []], [[], [], [], []]];
        let start_x = [Math.max(0, x - 5), x, x - Math.min(5, Math.min(x, y)), x + Math.min(5, Math.min(BOARD_WID - 1 - x, y))];
        let start_y = [y, Math.max(0, y - 5), y - Math.min(5, Math.min(x, y)), y - Math.min(5, Math.min(BOARD_WID - 1 - x, y))];
        let end_x = [Math.min(BOARD_WID - 1, x + 5), x, Math.min(BOARD_WID - 1, x + 5), BOARD_WID - 1];
        let end_y = [y, Math.min(BOARD_WID - 1, y + 5), Math.min(BOARD_WID - 1, y + 5), Math.min(BOARD_WID - 1, y + 5)];
        let dirs = [DIRECTIONS[1], DIRECTIONS[3], DIRECTIONS[5], DIRECTIONS[7]];
        let posIdx = toidx(x, y);

        this.board[posIdx] = TRYING;

        /* Store char array of four directions: vertical, horizontal, \ and / to line_arr */
        this._buildDirsCharArr(line_arr, start_x, start_y, end_x, end_y, dirs);

        let scores = [0, 0]
        for (let piece = 0; piece < 2; piece++) {
            let score = 0;
            for (let i = 0; i < 4; i++) {
                if (line_arr[piece][i].length != 0) {
                    let searchResult = this.ACSearcher.search(line_arr[piece][i]);

                    for (let j = 0; j < searchResult.length; j++) {
                        score += patternScores[searchResult[j]];
                    }
                }
            }
            scores[piece] += score;
        }

        this.board[posIdx] = NONE;

        return scores[BLACK - 1] + scores[WHITE - 1];
    }

    GobangEngine.prototype.makeMove = function(pos, role) {
        this.board[toidx(pos.x, pos.y)] = this.roleMap[role];
        this.updateState(pos, role);
        this.possiblePosMan.addPossiblePos(this.board, pos);
    }

    GobangEngine.prototype.undoMove = function(pos, role) {
        this.board[toidx(pos.x, pos.y)] = NONE;
        this.updateState(pos, role);
        this.possiblePosMan.rollback();
    }

    GobangEngine.prototype.minMaxSearch = function(dep, root, alpha, beta, role) {
        let hashItem;
        let pq;
        let branch = 9;
        let hashFlag = ALPHA;
        let selfScore = this.totalScore[this.roleMap[role] - 1];
        let enemyScore = this.totalScore[this.roleMap[1 - role] - 1];

        hashItem = this.tp.getHashItem();
        if (hashItem != null && hashItem.dep >= dep && root > 0) {
            if (hashItem.flag == EXACT) return hashItem.score; 
            if (hashItem.flag == ALPHA && hashItem.score <= alpha) return alpha;
            if (hashItem.flag == BETA && hashItem.score >= beta) return beta; 
        }

        if (selfScore + enemyScore >= WIN_SCORE) {
            return selfScore - enemyScore;
        }

        if (dep == 0) {
            let score = selfScore - enemyScore;
            this.tp.insertHashItem(dep, score, EXACT);
            return selfScore - enemyScore;
        }

        pq = new PQ.PriorityQueue(this.possiblePosMan.curPossiblePosSet.size, (a, b) => (a < b));
        for (let posIdx of this.possiblePosMan.curPossiblePosSet) {
            let pos = new Position(idx2x(posIdx), idx2y(posIdx));
            pos.setScore(this.calcFwPosScore(pos));
            pq.insert(pos);
        }

        while (!pq.empty() && branch >= 0) {
            let pos = pq.pop();

            this.makeMove(pos, role)
            let score = -this.minMaxSearch(dep - 1, root + 1, -beta, -alpha, 1 - role);
            this.undoMove(pos, role);

            if (score >= beta) {
                this.tp.insertHashItem(dep, beta, BETA);
                return beta;
            }
            if (score > alpha) {
                alpha = score;
                hashFlag = EXACT;
                if (root == 0) {
                    this.aiPos.updatePos(pos.x, pos.y);
                    this.aiPos.setScore(pos.key);
                }
            }
            branch--;
        }

        this.tp.insertHashItem(dep, alpha, hashFlag);
        return alpha;
    }

    GobangEngine.prototype.getMovesCnt = function() {
        return this.moves.length;
    }

    GobangEngine.prototype.playerMove = function(x, y) {
        if (this.board[toidx(x, y)] != NONE) {
            console.log("this location has been placed with a piece");
            return false;
        } else {
            let pos = new Position(x, y);
            this.makeMove(pos, HUMAN)
            this.moves.push(pos);

            return true;
        }
    }

    GobangEngine.prototype.aiMove = function() {
        if (this.moves.length == 0) {
            return this.aiFirstHandMove();
        }

        let score = undefined;
        for (let depLimit = 2; depLimit <= this.level; depLimit += 2) {
            score = this.minMaxSearch(depLimit, 0, MIN_SCORE, MAX_SCORE, COMPUTER);
            if (score >= WIN_SCORE/2) break; 
        }
        console.log("AI move scores at least %d in dep %d", score, this.level);

        let newAiPos = new Position(this.aiPos.x, this.aiPos.y); 
        newAiPos.setScore(this.aiPos.key);

        this.makeMove(newAiPos, COMPUTER)
        this.moves.push(newAiPos);

        return newAiPos;
    }

    GobangEngine.prototype.undoMoves = function() {
        if (this.moves.length < 2) {
            return null;
        }

        let lastAiPos = this.moves.pop();
        this.undoMove(lastAiPos, COMPUTER);

        let playerPos = this.moves.pop();
        this.undoMove(playerPos, HUMAN);

        return [lastAiPos, playerPos];
    }

    GobangEngine.prototype.reset = function() {
        while (this.moves.length > 0) this.moves.pop();
        this.board.fill(0);

        for (let piece = 0; piece < 2; piece++) {
            this.totalScore[piece] = 0;
            for (let i = 0; i < this.lineScores[piece].length; i++) {
                this.lineScores[piece][i] = 0;
            }
        }

        this.winner = -1;
        this.possiblePosMan.removeAll();
        this.aiPos.updatePos(-1, -1);
        this.aiPos.setScore(0);
        this.tp.reset();
    }

    GobangEngine.prototype.start = function() {
        if (this.roleMap[COMPUTER] == BLACK) {
            return this.aiFirstHandMove();
        } else {
            return null;
        }
    }

    GobangEngine.prototype.aiFirstHandMove = function() {
        let pos = new Position(7, 7);
        this.aiPos.updatePos(pos.x, pos.y);
        this.makeMove(this.aiPos, COMPUTER);
        this.moves.push(pos);
        return pos;
    }

    GobangEngine.prototype.switchPlayerAI = function() {
        let tmp = this.roleMap[HUMAN];
        this.roleMap[HUMAN] = this.roleMap[COMPUTER];
        this.roleMap[COMPUTER] = tmp;
    }

    GobangEngine.prototype.setLevel = function(level) {
        this.level = level;
    }

    GobangEngine.prototype.init = function() {
        this.ACSearcher = new AC.ACAutomata();
        this.ACSearcher.init(patterns);
        this.tp.reset();
        console.log("Gobang engine is initialized!");
    }

    GobangEngine.prototype.role2PieceType= function(role) {
        return this.roleMap[role];
    }

    GobangEngine.prototype.showBoard = function() {
        for (let x = 0; x < BOARD_WID; x++) {
            let str = "";
            for (let y = 0; y < BOARD_WID; y++) {
                if (this.board[toidx(x, y)] == NONE) str += '0';
                else if (this.board[toidx(x, y)] == BLACK) str += '1';
                else if (this.board[toidx(x, y)] == WHITE) str += '2';

            }
            console.log(str);
        }
    }

    GobangEngine.prototype.showDebugInfo = function() {
        console.log(this.possiblePosMan);
        console.log(this.totalScore);
        console.log(this.moves);
    }

    return {
        GobangEngine: GobangEngine
    };
}());
