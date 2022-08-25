// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/utils/Counters.sol";


contract Lottery{
    uint256 public randNonce = 0;
    uint256[] public totalLotteryArray;
    mapping(uint256=>mapping(address=>bool))public addressData; //lotteryId=>address=>entered or not
    mapping(address=>mapping(uint256=>uint256))public participantLotteryInfo;  //address=>lotteryId=>lotteryIdNumber
    mapping(uint256=>mapping(uint256=>address))public participantInfo;  //lotteryId=>participantId=>address
    mapping(uint256=>mapping(uint256=>uint256))public paymentInfo;   //lotteryId=>address=>amount
    mapping(uint256=>lotteryIdData)public dataset;
    using Counters for Counters.Counter;
    Counters.Counter private _lotteryIdCounter;

    struct lotteryIdData{
        address lotteryCreator;
        uint256 lotteryEnterAmount;
        uint256 lotteryTotalParticipants;
        uint256 enteredParticipantCount;
        uint256 participantsCounter;
        uint256 collectedAmount;
        bool isOpen;
        bool isWinnerSelected;
    }


    event lotteryCreated(uint256 lotteryId,address lotteryCreator,uint256 lotteryEnterAmount,uint256 lotteryMaxParticipants);
    event enteredInLottery(address participantAddress,uint256 lotteryId,uint256 amount,uint256 participantNumber);



    function createLottery(uint256 _maxParticipants,uint256 _priceToEnter) public{

        require(_priceToEnter>0,"Minimum amount to enter lottery required");
        require(_maxParticipants>2,"Minimum 2 participants require to create lottery");

        _lotteryIdCounter.increment();
        uint256 currentLotteryId = _lotteryIdCounter.current();
        address owner = msg.sender;
        dataset[currentLotteryId] = lotteryIdData(owner,_priceToEnter,_maxParticipants,0,0,0,true,false);
        totalLotteryArray.push(currentLotteryId);
        emit lotteryCreated(currentLotteryId,owner,_priceToEnter,_maxParticipants);
    }


    function enterLottery(uint256 _lotteryNumber)public payable{
        require(addressData[_lotteryNumber][msg.sender]==false,"Cannot enter lottery twice");
        require(dataset[_lotteryNumber].enteredParticipantCount < dataset[_lotteryNumber].lotteryTotalParticipants,"Entry is closed");
        require(msg.value == (dataset[_lotteryNumber].lotteryEnterAmount)* 1 ether,"Please enter enough amount to enter lottery or call check lotteryPrice function");

        dataset[_lotteryNumber].enteredParticipantCount +=1;
        participantLotteryInfo[msg.sender][_lotteryNumber] +=1; 
        participantInfo[_lotteryNumber][participantLotteryInfo[msg.sender][_lotteryNumber]] = msg.sender;
        dataset[_lotteryNumber].collectedAmount +=msg.value;
        addressData[_lotteryNumber][msg.sender]=true;

        if(dataset[_lotteryNumber].enteredParticipantCount == dataset[_lotteryNumber].lotteryTotalParticipants){
            dataset[_lotteryNumber].isOpen = false;
        }
        emit enteredInLottery(msg.sender,_lotteryNumber,msg.value,participantLotteryInfo[msg.sender][_lotteryNumber]);
    }

    function getWinner(uint256 _lotteryNumber)public returns(address){

        require(dataset[_lotteryNumber].lotteryCreator == msg.sender,"Only lottery owners are allowed to choose winner");
        require(dataset[_lotteryNumber].isWinnerSelected == false,"This lottery has already declared a winner");

        uint256 winnerNumber;
        randNonce++; 
        while (winnerNumber==0) {
            winnerNumber =  uint(keccak256(abi.encodePacked(block.timestamp,msg.sender,randNonce))) % (dataset[_lotteryNumber].enteredParticipantCount);
        }
        dataset[_lotteryNumber].isWinnerSelected = true;

        (bool sentToWinner,) = participantInfo[_lotteryNumber][winnerNumber].call{value: (dataset[_lotteryNumber].collectedAmount)*99/100 }("");
        require(sentToWinner, "Failed to send Ether to winner");
        dataset[_lotteryNumber].collectedAmount -= (dataset[_lotteryNumber].collectedAmount)*99/100;

        (bool sentToCreator,) = (dataset[_lotteryNumber].lotteryCreator).call{value: dataset[_lotteryNumber].collectedAmount }("");
        require(sentToCreator, "Failed to send Ether to lottery creator");
        dataset[_lotteryNumber].collectedAmount = 0;

        return(participantInfo[_lotteryNumber][winnerNumber]);
    }

    function getLotteryEnterPrice(uint256 _lotteryNumber)public view returns(uint256){
        return(dataset[_lotteryNumber].lotteryEnterAmount);
    }

    function getLotteryArray()public view returns(uint256[]memory){
        return(totalLotteryArray);
    }

    function getLotteryOwner(uint256 _lotteryId)public view returns(address){
        return(dataset[_lotteryId].lotteryCreator);
    }

    // function getConBalance()public view returns(uint256){
    //     return(address(this).balance);
    // }

}