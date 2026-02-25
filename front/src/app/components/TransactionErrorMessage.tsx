type TransactionErrorMessageProps = {
  message: string;
  dismiss: React.MouseEventHandler<HTMLButtonElement>;
};

const TransactionErrorMessage: React.FunctionComponent<
  TransactionErrorMessageProps
> = ({ message, dismiss }) => {
  return (
    <div>
      Tx error: {message}
      <button type="button" onClick={dismiss}>
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
};

export default TransactionErrorMessage;
