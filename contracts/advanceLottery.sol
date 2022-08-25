// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/utils/Counters.sol";

contract AdvanceLottery{

    uint256 public randNonce = 0;
    uint256[] public totalLotteryArray;
    mapping(uint256=>mapping(address=>bool))public addressData; //lotteryId=>address=>entered or not
    mapping(address=>mapping(uint256=>uint256))public participantLotteryInfo;  //address=>lotteryId=>lotteryIdNumber
    mapping(uint256=>mapping(uint256=>address))public participantInfo;  //lotteryId=>participantId=>address
    mapping(uint256=>mapping(uint256=>uint256))public paymentInfo;   //lotteryId=>address=>amount
    mapping(uint256=>lotteryIdData)public dataset;
    mapping(uint256=>mapping(address=>uint256[]))public enteredDataInfo;
    mapping(uint256=>uint256[])public lotteryWinner;
    mapping(uint256=>mapping(address=>uint256))public matchingCount;
    mapping(uint256=>mapping(address=>bool))public hasClaimed;
    mapping(uint256=>uint256)public totalPotValue;
    using Counters for Counters.Counter;
    Counters.Counter private _lotteryIdCounter;

    struct lotteryIdData{
        address lotteryCreator;
        uint256 lotteryEnterAmount;
        uint256 lotteryTotalParticipants;
        uint256 enteredParticipantCount;
        uint256 participantsCounter;
        uint256 collectedAmount;
        //bool isOpen;
        //bool isWinnerSelected;
    }
    event lotteryCreated(uint256 lotteryId,address lotteryCreator,uint256 lotteryEnterAmount,uint256 lotteryMaxParticipants);
    event enteredInLottery(address participantAddress,uint256 lotteryId,uint256 amount,uint256 participantNumber);

    function createLottery(uint256 _maxParticipants,uint256 _priceToEnter) public{

        require(_priceToEnter>0,"Minimum amount to enter lottery required");
        require(_maxParticipants>2,"Minimum 2 participants require to create lottery");

        _lotteryIdCounter.increment();
        uint256 currentLotteryId = _lotteryIdCounter.current();
        address owner = msg.sender;
        dataset[currentLotteryId] = lotteryIdData(owner,_priceToEnter,_maxParticipants,0,0,0);
        totalLotteryArray.push(currentLotteryId);
        emit lotteryCreated(currentLotteryId,owner,_priceToEnter,_maxParticipants);
    }

    function enterLottery(uint256[4]memory _entryNumber,uint256 _lotteryNumber)public payable{
        require(_entryNumber.length == 4,"Please enter 4 numbers");
        require(addressData[_lotteryNumber][msg.sender]==false,"Cannot enter lottery twice");
        require(dataset[_lotteryNumber].enteredParticipantCount < dataset[_lotteryNumber].lotteryTotalParticipants,"Entry is closed");
        require(msg.value == (dataset[_lotteryNumber].lotteryEnterAmount)* 1 ether,"Please enter enough amount to enter lottery or call check lotteryPrice function");
        
        dataset[_lotteryNumber].enteredParticipantCount +=1;
        participantLotteryInfo[msg.sender][_lotteryNumber] +=1; 
        participantInfo[_lotteryNumber][participantLotteryInfo[msg.sender][_lotteryNumber]] = msg.sender;
        dataset[_lotteryNumber].collectedAmount +=msg.value;
        addressData[_lotteryNumber][msg.sender]=true;

        enteredDataInfo[_lotteryNumber][msg.sender] = _entryNumber;
        totalPotValue[_lotteryNumber] = dataset[_lotteryNumber].collectedAmount;
    
    }

    function getWinner(uint256 _lotteryNumber,uint256[]memory _winningNumber)public{
        require(msg.sender==dataset[_lotteryNumber].lotteryCreator,"Only lottery owners are allowed to choose winner");
       lotteryWinner[_lotteryNumber] = _winningNumber; 
    }

    function claimPrice(uint256 _lotteryNumber)public payable{
        require(hasClaimed[_lotteryNumber][msg.sender]==false,"Price already claimed");
        require(dataset[_lotteryNumber].collectedAmount >=0, "all the price has been claimed");

        uint256[]memory lotteryWinningNumber = lotteryWinner[_lotteryNumber];
        uint256[]memory lotteryUserNumber = enteredDataInfo[_lotteryNumber][msg.sender];
        for(uint i=0; i<lotteryWinningNumber.length;i++){
            if(lotteryWinningNumber[i] == lotteryUserNumber[i]){
                matchingCount[_lotteryNumber][msg.sender] += 1;
            }
        }
        uint256 winningValue = (totalPotValue[_lotteryNumber])*matchingCount[_lotteryNumber][msg.sender]*10/100;
        (bool sentToWinner,) = (msg.sender).call{value: winningValue }("");
        require(sentToWinner, "Failed to send Ether to winner");
        dataset[_lotteryNumber].collectedAmount -= winningValue;
        hasClaimed[_lotteryNumber][msg.sender] = true;
    }

    function getPotPrice(uint256 _lotteryNumber)public view returns(uint256){
        return(totalPotValue[_lotteryNumber]);
    }
}