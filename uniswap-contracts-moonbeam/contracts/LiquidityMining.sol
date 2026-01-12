// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LiquidityMining
 * @notice 流动性挖矿合约 - 用户质押LP代币，获得NBC奖励
 * @dev 这是一个额外的奖励层，不影响原有的0.3%手续费机制
 */
contract LiquidityMining is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // NBC奖励代币
    IERC20 public nbcToken;
    
    // 每个区块的NBC奖励数量
    uint256 public nbcPerBlock;
    
    // 开始区块
    uint256 public startBlock;
    
    // 结束区块
    uint256 public endBlock;

    // 池子信息
    struct PoolInfo {
        IERC20 lpToken;           // LP代币地址
        uint256 allocPoint;       // 分配权重
        uint256 lastRewardBlock;  // 最后奖励区块
        uint256 accNbcPerShare;   // 累积的每股NBC
        uint256 totalStaked;      // 总质押量
    }

    // 用户信息
    struct UserInfo {
        uint256 amount;           // 用户质押的LP数量
        uint256 rewardDebt;       // 奖励债务
        uint256 pendingRewards;   // 待领取奖励
    }

    // 所有池子
    PoolInfo[] public poolInfo;
    
    // 用户信息 poolId => user => UserInfo
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    // 总分配权重
    uint256 public totalAllocPoint = 0;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        IERC20 _nbcToken,
        uint256 _nbcPerBlock,
        uint256 _startBlock
    ) {
        nbcToken = _nbcToken;
        nbcPerBlock = _nbcPerBlock;
        startBlock = _startBlock;
        endBlock = _startBlock + (365 * 24 * 60 * 60 / 12); // 假设12秒一个区块，持续1年
    }

    /**
     * @notice 添加新的LP池子
     * @param _allocPoint 分配权重
     * @param _lpToken LP代币地址
     * @param _withUpdate 是否更新所有池子
     */
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        bool _withUpdate
    ) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint + _allocPoint;
        
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accNbcPerShare: 0,
                totalStaked: 0
            })
        );
    }

    /**
     * @notice 更新池子的分配权重
     */
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    /**
     * @notice 获取待领取的NBC奖励
     */
    function pendingNbc(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accNbcPerShare = pool.accNbcPerShare;
        uint256 lpSupply = pool.totalStaked;
        
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 nbcReward = (multiplier * nbcPerBlock * pool.allocPoint) / totalAllocPoint;
            accNbcPerShare = accNbcPerShare + (nbcReward * 1e12 / lpSupply);
        }
        
        return (user.amount * accNbcPerShare / 1e12) - user.rewardDebt + user.pendingRewards;
    }

    /**
     * @notice 更新所有池子
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /**
     * @notice 更新单个池子的奖励
     */
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        
        uint256 lpSupply = pool.totalStaked;
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 nbcReward = (multiplier * nbcPerBlock * pool.allocPoint) / totalAllocPoint;
        
        pool.accNbcPerShare = pool.accNbcPerShare + (nbcReward * 1e12 / lpSupply);
        pool.lastRewardBlock = block.number;
    }

    /**
     * @notice 质押LP代币
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accNbcPerShare / 1e12) - user.rewardDebt;
            if (pending > 0) {
                user.pendingRewards = user.pendingRewards + pending;
            }
        }
        
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount + _amount;
            pool.totalStaked = pool.totalStaked + _amount;
        }
        
        user.rewardDebt = user.amount * pool.accNbcPerShare / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @notice 提取LP代币
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "withdraw: not good");
        
        updatePool(_pid);
        
        uint256 pending = (user.amount * pool.accNbcPerShare / 1e12) - user.rewardDebt;
        if (pending > 0) {
            user.pendingRewards = user.pendingRewards + pending;
        }
        
        if (_amount > 0) {
            user.amount = user.amount - _amount;
            pool.totalStaked = pool.totalStaked - _amount;
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        
        user.rewardDebt = user.amount * pool.accNbcPerShare / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @notice 领取NBC奖励
     */
    function harvest(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        uint256 pending = (user.amount * pool.accNbcPerShare / 1e12) - user.rewardDebt + user.pendingRewards;
        
        if (pending > 0) {
            user.pendingRewards = 0;
            safeNbcTransfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }
        
        user.rewardDebt = user.amount * pool.accNbcPerShare / 1e12;
    }

    /**
     * @notice 紧急提取（放弃奖励）
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        pool.totalStaked = pool.totalStaked - amount;
        
        pool.lpToken.safeTransfer(address(msg.sender), amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    /**
     * @notice 安全的NBC转账
     */
    function safeNbcTransfer(address _to, uint256 _amount) internal {
        uint256 nbcBal = nbcToken.balanceOf(address(this));
        if (_amount > nbcBal) {
            nbcToken.safeTransfer(_to, nbcBal);
        } else {
            nbcToken.safeTransfer(_to, _amount);
        }
    }

    /**
     * @notice 获取区块乘数
     */
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= endBlock) {
            return _to - _from;
        } else if (_from >= endBlock) {
            return 0;
        } else {
            return endBlock - _from;
        }
    }

    /**
     * @notice 更新每个区块的NBC奖励
     */
    function updateNbcPerBlock(uint256 _nbcPerBlock) external onlyOwner {
        massUpdatePools();
        nbcPerBlock = _nbcPerBlock;
    }

    /**
     * @notice 获取池子数量
     */
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }
}
