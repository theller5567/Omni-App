import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MediaDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [media, setMedia] = useState<any>(null);

  useEffect(() => {
    // Fetch media details using the slug
    axios.get(`/api/media/${slug}`)
      .then(response => setMedia(response.data))
      .catch(error => console.error('Error fetching media:', error));
  }, [slug]);

  const handleEdit = () => {
    // Implement edit functionality
  };

  if (!media) return <div>Loading...</div>;

  return (
    <div>
      <h1>{media.title}</h1>
      <img src={media.imageUrl} alt={media.title} />
      <p>{media.description}</p>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
};

export default MediaDetail;