import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import PhotosPanel from './PhotosPanel';

const PhotosPanelWrapper = observer(({ store }) => {
  const [query, setQuery] = useState('');

  return <PhotosPanel store={store} query={query} setQuery={setQuery} />;
});

export default PhotosPanelWrapper;