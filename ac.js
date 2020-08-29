var AC = (function() {
    function Node(state) {
        this.parentNode = null;
        this.children = {};
        this.state = state;
        this.out = [];
        this.fail = null;
    }

    function ACAutomata() {
        this.root = new Node(0);
        this.maxState = 0;
        this.pats = [];
    }

    ACAutomata.prototype.loadPattern = function(pat) {
        this.pats.push(pat);
        console.log("push");
    }

    ACAutomata.prototype.loadPatterns = function(pats) {
        for (let i = 0; i < pats.length; i++) {
            this.loadPattern(pats[i]);
        }
    }

    ACAutomata.prototype.buildTrie = function() {
        for (let i = 0; i < this.pats.length; i++) {
            let currNode = this.root;
            let pat = this.pats[i];
            for (let j = 0; j < pat.length; j++) {
                if (!currNode.children[pat[j]]) {
                    this.maxState++;
                    currNode.children[pat[j]] = new Node(this.maxState);
                    currNode.children[pat[j]].parentNode = currNode;
                }
                currNode = currNode.children[pat[j]];
            }
            currNode.out.push(i); //keep the index of patterns
        }
    }

    ACAutomata.prototype.buildFailure = function() {
        let curNode = this.root;
        let q = [];

        for (let key in this.root.children) {
            let childNode = curNode.children[key];
            childNode.fail = curNode;
            q.push(childNode);
        }

        while (q.length > 0) {
            curNode = q.shift();
            for (let key in curNode.children) {
                let childNode = curNode.children[key];
                q.push(childNode);

                let failTo = curNode.fail;
                while (true) {
                    if (key in failTo.children) {
                        childNode.fail = failTo.children[key];
                        if (childNode.fail.out.length > 0) {
                            childNode.out.push(...childNode.fail.out)
                        }
                        break;
                    } else {
                        failTo = failTo.fail;
                    }

                    if (failTo == null) {
                        childNode.fail = this.root;
                        break;
                    }
                }
            }
        }
    }

    ACAutomata.prototype.search = function(text) {
        let curNode = this.root;
        let ret = [];

        for (let i = 0; i < text.length;) {
            if (text[i] in curNode.children) {
                curNode = curNode.children[text[i]];
                i++;
            } else {
                while (curNode.fail != null && !(text[i] in curNode.children)) {
                    curNode = curNode.fail;
                }
                if (!(text[i] in curNode.children)) {
                    i++;
                }
            }

            for (let j = 0; j < curNode.out.length; j++) {
                let pat = this.pats[curNode.out[j]];
                ret.push(curNode.out[j]);
            }
        }
        return ret;
    }

    ACAutomata.prototype.init = function(pats) {
        this.loadPatterns(pats)
        this.buildTrie();
        this.buildFailure();
    }

    ACAutomata.prototype.traverse = function() {
        var curNode = this.root;

        var q = [];
        q.push(curNode);
        while (q.length > 0) {
            curNode = q.shift();
            for (let key in curNode.children) {
                let childNode = curNode.children[key];
                console.log("%d to %d through %s", curNode.state, childNode.state, key);
                console.log("state %d fail to state %d", childNode.state, childNode.fail.state);
                console.log("state %d has out", childNode.state);
                console.log(childNode.out);
                q.push(childNode);
            }
        }
    }

    return {
        ACAutomata: ACAutomata
    };
}());
