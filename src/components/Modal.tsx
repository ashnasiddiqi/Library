import React from "react";

interface VolumeInfo {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  previewLink: string;
  imageLinks?: {
    smallThumbnail?: string,
  };
}

interface Item {
  volumeInfo: VolumeInfo;
}

interface ModalProps {
  show: boolean;
  item: Item;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ show, item, onClose }) => {
  if (!show) return null;

  const thumbnail = item.volumeInfo.imageLinks?.smallThumbnail;

  return (
    <>
      <div className="overlay">
        <div className="overlay-inner">
          <button className="close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
          <div className="inner-box">
            {thumbnail && <img src={thumbnail} alt={item.volumeInfo.title} />}
            <div className="info">
              <h1>{item.volumeInfo.title}</h1>
              <h3>{item.volumeInfo.authors?.join(", ")}</h3>
              <h4>
                {item.volumeInfo.publisher}
                <span> {item.volumeInfo.publishedDate}</span>
              </h4>
              <br />
              <a
                href={item.volumeInfo.previewLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button>More</button>
              </a>
            </div>
          </div>
          <h4 className="description">{item.volumeInfo.description}</h4>
        </div>
      </div>
    </>
  );
};

export default Modal;
