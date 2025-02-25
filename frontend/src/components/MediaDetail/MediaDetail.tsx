import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./mediaDetail.scss";
import axios from "axios";
import { Chip, Button, CircularProgress } from "@mui/material";
import MediaFile from "../../interfaces/MediaFile";
import { useNavigate } from "react-router-dom";

const MediaDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMediaFile = async () => {
      try {
        const response = await axios.get<MediaFile>(
          `http://localhost:5002/media/slug/${slug}`
        );
        console.log('responseData', response.data);
        setMediaFile(response.data);
      } catch (error) {
        console.error("Error fetching media file:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMediaFile();
  }, [slug]);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  const handleEdit = () => {
    // Implement edit functionality
  };

  if (loading) {
    return <div className="loading-container"><CircularProgress /></div>;
  }

  if (!mediaFile) {
    return <div>Error loading media file.</div>;
  }

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="media-detail-wrapper">
      <div className="navbar">
        <Button variant="contained" color="info" onClick={goBack}>
          Back
        </Button>
      </div>
      <div className="media-detail">
        <div className="img-container">
          <img src={mediaFile.location} alt={mediaFile.metadata.altText} />
        </div>
      <div className="media-information">
        <h1>{mediaFile.metadata.fileName}</h1>
        <p>Description: <span>{mediaFile.metadata.description}</span></p>
        <p>Size: <span>{formatFileSize(mediaFile.fileSize)}</span></p>
        <p>Created: <span>{new Date(mediaFile.modifiedDate).toLocaleDateString()}</span></p>
        <p>Extension: <span>{mediaFile.fileExtension}</span></p>
        <div className="tags">
          {mediaFile.metadata.tags.map((tag) => (
            <Chip
              key={tag}
              className="tag"
              color="primary"
              label={tag}
              size="small"
            />
          ))}
        </div>
        <Button variant="contained" color="primary" onClick={handleEdit}>
          Edit
        </Button>
        </div>
      </div>
    </div>
  );
};

export default MediaDetail;
