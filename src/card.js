import React from "react";
import classnames from "classnames";

import "./card.css";

const Card = ({ onClick, card, index, isInactive, isFlipped, isDisabled }) => {
  const handleClick = () => {
    !isFlipped && !isDisabled && onClick(index);
  };

  return (
    <div
      className={classnames("card", {
        "is-flipped": isFlipped,
        "is-inactive": isInactive
      })}
      onClick={handleClick}
    >
      <div className="card-face card-font-face">
        <p className="qn">?</p>
      </div>
      <div className="card-face card-back-face">
        <p>{card.text}</p>
      </div>
    </div>
  );
};

export default Card;
