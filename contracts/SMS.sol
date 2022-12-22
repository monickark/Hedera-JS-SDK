// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/Ownable.sol";
pragma solidity 0.8.6;

/// @title Hedera Student Management System
/// @notice This contract manages the Name of the Student along with the time of Student signature.
contract SMS is Ownable {
    struct StudentDetails {
        bytes32 StudentName;
        bytes32 StudentDept;
        bytes32 StudentAge;
        uint64 timeStamp;
    }

    mapping(bytes32 => StudentDetails) public Student;

    constructor() Ownable(){}


    modifier isStudentIdExist(bytes32 StudentId) {
        require(
            Student[StudentId].timeStamp == 0,
            "HEDERA SMS: StudentId already Exists"
        );
        _;
    }
    event StudentDetailsAdded(
        bytes32 StudentId,
        bytes32 StudentName,
        bytes32 StudentDept,
        bytes32 StudentAge,
        uint64 timestamp
    );

    /// @notice Function to add Student details to the Student id
    /// @param StudentId unique ID of the Student
    /// @param StudentName Name of the Student to be added to the StudentID
    /// @param timeStamp ,Timestamp of the time when the Student is signed.
    function addStudentDetails(
        bytes32  StudentId,
        bytes32 StudentName,
        bytes32 StudentDept,
        bytes32 StudentAge,
        uint64 timeStamp
    ) external onlyOwner isStudentIdExist(StudentId) {
        Student[StudentId] = StudentDetails(StudentName, StudentDept, StudentAge, timeStamp);
        emit StudentDetailsAdded(StudentId, StudentName, StudentDept, StudentAge, timeStamp);
    }

}
