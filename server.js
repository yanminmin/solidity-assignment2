var app = require('express')();
var bodyParser = require('body-parser');
var config = require('./config');
var Web3 = require('web3');
const ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_phaseLengthInSeconds",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_choice1",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_choice2",
                "type": "string"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "commit",
                "type": "bytes32"
            }
        ],
        "name": "NewVoteCommit",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "commit",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "choice",
                "type": "string"
            }
        ],
        "name": "NewVoteReveal",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "choice1",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "choice2",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "commitPhaseEndTime",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "numberOfVotesCast",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "voteCommits",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "voteStatuses",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "votesForChoice1",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "votesForChoice2",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "voteCommit",
                "type": "bytes32"
            }
        ],
        "name": "commitVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "vote",
                "type": "string"
            },
            {
                "internalType": "bytes32",
                "name": "voteCommit",
                "type": "bytes32"
            }
        ],
        "name": "revealVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getWinner",
        "outputs": [
            {
                "internalType": "string",
                "name": "winner",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getVoteCommitsArray",
        "outputs": [
            {
                "internalType": "bytes32[]",
                "name": "",
                "type": "bytes32[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

var winner = ''
var votecount = 0

var web3 = new Web3(new Web3.providers.HttpProvider(config.rpcserver));
var accounts
web3.eth.getAccounts(function (err, result) {
    console.log(err, result)
    if (err != null) {
        throw err
    }
    if (result != null && result != undefined && result.length > 0) {
        accounts = result
    }
})
let endtime = 0
var contract = new web3.eth.Contract(ABI, config.contractaddress);

contract.methods.commitPhaseEndTime().call(function (err, result) {
    console.log('commitPhaseEndTime', err, result)
    if (err != undefined || result == undefined || result == null) {
        throw ('获取合约截止时间出错,提示:' + err)
        return
    }
    endtime = result * 1000
})


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

function successResponse(res, tip) {
    res.set("Content-Type", "application/json");
    res.json({code: 0, error: tip});
}

function errResponse(res, err) {
    res.set("Content-Type", "application/json");
    res.json({code: -1, error: err});
}

app.post('/commit', function (req, res) {
    console.log(req.body);
    if (accounts == undefined || accounts == null || accounts.length == 0) {
        errResponse(res, '系统错误');
        return;
    }
    if (req.body.choice != 'YES' && req.body.choice != 'NO') {
        errResponse(res, '投票参数不正确');
        return
    }
    if (req.body.secret == undefined || req.body.secret == null || req.body.secret == '') {
        errResponse(res, '密码啊不能为空');
        return
    }
    let v = web3.utils.sha3(req.body.choice == 'YES' ? '1' : '2' + '~' + req.body.secret)
    contract.methods.commitVote(v).send({
        from: accounts[0]
    }, function (err, result) {
        if (err) {
            console.log(accounts[0], err)
            errResponse(res, '出错了,提示:' + err)
        } else {
            successResponse(res, '投票已提交到交易池中.')
        }
    })
});

app.post('/reveal', function (req, res) {
    console.log(req.body);
    if (accounts == undefined || accounts == null || accounts.length == 0) {
        errResponse(res, '系统错误');
        return;
    }
    if (req.body.choice != 'YES' && req.body.choice != 'NO') {
        errResponse(res, '投票参数不正确');
        return
    }
    if (req.body.secret == undefined || req.body.secret == null || req.body.secret == '') {
        errResponse(res, '密码啊不能为空');
        return
    }
    let key = req.body.choice == 'YES' ? '1' : '2' + '~' + req.body.secret
    let v = web3.utils.sha3(key)
    contract.methods.revealVote(key, v).send({
        from: accounts[0]
    }, function (err, result) {
        if (err) {
            console.log(accounts[0], err)
            errResponse(res, '出错了,提示:' + err)
        } else {
            successResponse(res, '开票已提交到交易池中.')
        }
    })
});

app.get('/revealed', function (req, res) {
    let doing = new Date().getTime() < endtime
    res.set("Content-Type", "application/json");
    if (doing) {
        res.json({code: 0, error: '', step: 0, winner: '', count: 0});
        return
    }
    if (winner != '' && votecount > 0) {
        res.json({code: 0, error: '', step: 2, winner: winner, count: votecount});
        return;
    }
    contract.methods.getWinner().call(function (err, result) {
        console.log('getWinner', err, result)
        if (err) {
            res.json({code: 0, error: '', step: 1, winner: '', count: 0});
            return
        }
        winner = result
        contract.methods.getVoteCommitsArray().call(function (err, result) {
            if (err) {
                res.json({code: 0, error: err, step: 2, winner: winner, count: 0});
            } else {
                votecount = result.length
                res.json({code: 0, error: '', step: 2, winner: winner, count: votecount});
            }
        })

    })
});


var server = app.listen(config.apiPort, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('address is http://%s:%s', host, port);
});
