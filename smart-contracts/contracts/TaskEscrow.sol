// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * One-path escrow:
 * - fund(taskId, worker) payable  // poster -> contract
 * - release(taskId)               // contract -> worker
 * - cancel(taskId)                // optional refund before release
 *
 * Invariants:
 * - poster != worker
 * - amount must match/cover agreed reward off-chain
 * - only poster can fund/release/cancel
 * - no double funding/release
 */
contract TaskEscrow {
    struct Escrow {
        address poster;
        address worker;
        uint256 amount;    // wei currently held for this task
        bool    funded;    // at least one successful fund
        bool    released;  // payout executed
        bool    cancelled; // refund executed
    }

    // Use Supabase tasks.id as the key
    mapping(uint256 => Escrow) public escrows;

    event Funded(uint256 indexed taskId, address indexed poster, address indexed worker, uint256 amount);
    event Released(uint256 indexed taskId, address indexed poster, address indexed worker, uint256 amount);
    event Cancelled(uint256 indexed taskId, address indexed poster, uint256 amount);

    // Poster deposits ETH for a specific task + assigned worker.
    function fund(uint256 taskId, address worker_) external payable {
        require(msg.value > 0, "no value");
        Escrow storage e = escrows[taskId];

        if (e.poster == address(0)) {
            // first time
            e.poster = msg.sender;
            e.worker = worker_;
        } else {
            // subsequent top-ups must match identities
            require(msg.sender == e.poster, "only poster");
            require(e.worker == worker_, "worker mismatch");
        }

        require(e.poster != e.worker, "poster == worker");
        require(!e.released, "already released");
        require(!e.cancelled, "already cancelled");

        e.amount += msg.value;
        e.funded = true;

        emit Funded(taskId, e.poster, e.worker, msg.value);
    }

    // Poster releases escrow to the worker.
    function release(uint256 taskId) external {
        Escrow storage e = escrows[taskId];
        require(e.poster != address(0), "unknown task");
        require(msg.sender == e.poster, "only poster");
        require(!e.released, "already released");
        require(!e.cancelled, "already cancelled");
        require(e.funded && e.amount > 0, "not funded");

        e.released = true;
        uint256 amt = e.amount;
        e.amount = 0;

        (bool ok, ) = payable(e.worker).call{value: amt}("");
        require(ok, "transfer failed");

        emit Released(taskId, e.poster, e.worker, amt);
    }

    // (Optional) Poster can refund before release.
    function cancel(uint256 taskId) external {
        Escrow storage e = escrows[taskId];
        require(e.poster != address(0), "unknown task");
        require(msg.sender == e.poster, "only poster");
        require(!e.released, "already released");
        require(!e.cancelled, "already cancelled");
        require(e.amount > 0, "nothing to refund");

        e.cancelled = true;
        uint256 amt = e.amount;
        e.amount = 0;

        (bool ok, ) = payable(e.poster).call{value: amt}("");
        require(ok, "refund failed");

        emit Cancelled(taskId, e.poster, amt);
    }

    // Optional helper; mapping getter also exists.
    function getEscrow(uint256 taskId)
        external
        view
        returns (address poster, address worker, uint256 amount, bool funded, bool released, bool cancelled)
    {
        Escrow storage e = escrows[taskId];
        return (e.poster, e.worker, e.amount, e.funded, e.released, e.cancelled);
    }
}
