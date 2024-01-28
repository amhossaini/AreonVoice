'use strict';
module.exports = (sequelize, DataTypes) => {
  const Transactions = sequelize.define('Transactions', {
    blockHash: DataTypes.STRING,
    blockNumber: 'integer',
    contractAddress: DataTypes.STRING,
    cumulativeGasUsed: 'integer',
    effectiveGasPrice: 'integer',
    from: DataTypes.STRING,
    gasUsed: 'integer',
    transactionStatus: 'boolean',
    to: DataTypes.STRING,
    transactionHash: DataTypes.STRING,
    transactionIndex: 'integer',
    type: DataTypes.STRING,
    createDateTime: 'timestamp with time zone',
    chainId: DataTypes.STRING,
  }, {timestamps:false,tableName:'transactions'});
  Transactions.associate = function(models) {
    // associations can be defined here
  };
  return Transactions;
};
