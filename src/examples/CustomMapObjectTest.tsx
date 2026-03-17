import { useState, useEffect } from 'react';
import { useCustomMapObject, useMapOverlays, CustomMapObject } from '@twinmatrix/spatialverse-sdk-web/react';
import { Card, Button } from '@twinmatrix/ui-sdk';

/**
 * Test component for custom map objects functionality
 * This demonstrates how to add, remove, update, and search custom map objects
 */
export const CustomMapObjectTest = () => {
  const {
    addMapObject,
    removeMapObject,
    updateMapObject,
    getCustomMapObjects,
    clearCustomMapObjects,
    isReady,
  } = useCustomMapObject();

  const {
    addImage,
    loadImage,
    isReady: overlaysReady,
  } = useMapOverlays();

  const [customObjects, setCustomObjects] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const [shopIconRegistered, setShopIconRegistered] = useState<boolean>(false);

  // Refresh custom objects list
  const refreshList = () => {
    const objects = getCustomMapObjects();
    setCustomObjects(objects);
  };

  useEffect(() => {
    if (isReady) {
      refreshList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // Load and register the custom shop icon once overlays and map are ready
  useEffect(() => {
    if (!isReady || !overlaysReady || shopIconRegistered) {
      return;
    }

    loadImage('/icons/restaurant.png')
      .then((image) => {
        addImage('custom_shop_icon', image);
        setShopIconRegistered(true);
      })
      .catch((error) => {
        console.warn('[CustomMapObjectTest] Failed to load shop icon:', error);
      });
  }, [isReady, overlaysReady, shopIconRegistered]);

  // Example 1: Add a custom restaurant with default layers
  const addRestaurant = () => {
    try {
      const restaurant: CustomMapObject = {
        mapObjectId: `custom-restaurant-${Date.now()}`,
        name: 'My Custom Restaurant',
        geometry: {
          type: 'Point',
          coordinates: [103.8464613847388, 1.3895119307208716],
        },
        whatDimension: 'what.service.restaurant',
        whereDimension: 'where.ste.digihub.l1',
        localRef: 'REST-001',
        properties: {
          isSearchable: true,
          metadata: {
            cuisine: 'Italian',
            rating: 4.5,
          },
        },
        // No layers provided - will use default layers
      };

      addMapObject(restaurant);
      setMessage('✅ Restaurant added successfully!');
      refreshList();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Example 2: Add a custom shop with user-provided layers
  const addShop = () => {
    try {
      const shop: CustomMapObject = {
        mapObjectId: `custom-shop-${Date.now()}`,
        name: 'My Custom Shop',
        geometry: {
          type: 'Point',
          coordinates: [103.84686138473881, 1.3899119307208716],
        },
        whatDimension: 'what.service.shop',
        whereDimension: 'where.ste.digihub.l1',
        properties: {
          isSearchable: true,
        },
        layers: [
          {
            id: `custom-shop-point-${Date.now()}`,
            type: 'symbol',
            source: 'customMapObjects', // Will be set automatically
            filter:
            [
              "all",
              [
                "==",
                [
                  "geometry-type"
                ],
                "Point" // only show for points
              ],
              [
                "in",
                [
                  "get",
                  "dimension_what"
                ],
                [
                  "literal",
                  [
                    "what.service.shop" // only show for what.service.shop
                  ]
                ]
              ]
            ],
            layout: {
              'icon-image': 'custom_shop_icon',
              'icon-size': 0.25,
              'icon-allow-overlap': true,
            },
          },
        ],
      };

      addMapObject(shop);
      setMessage('✅ Shop added successfully with custom layers!');
      refreshList();
    } catch (error: any) {
      console.error('[CustomMapObjectTest] Error adding shop:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Example 3: Add a LineString (path)
  const addPath = () => {
    try {
      const path: CustomMapObject = {
        mapObjectId: `custom-path-${Date.now()}`,
        name: 'Custom Path',
        geometry: {
          type: 'LineString',
          coordinates: [
            [103.8458613847388, 1.3889119307208715],
            [103.8464613847388, 1.3895119307208716],
            [103.8470613847388, 1.3901119307208716],
          ],
        },
        whatDimension: 'what.infra.path',
        whereDimension: 'where.ste.digihub.l1',
        properties: {
          isSearchable: false,
        },
      };

      addMapObject(path);
      setMessage('✅ Path added successfully!');
      refreshList();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Example 4: Add a Polygon (area)
  const addArea = () => {
    try {
      const area: CustomMapObject = {
        mapObjectId: `custom-area-${Date.now()}`,
        name: 'Custom Area',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [103.8458613847388, 1.3889119307208715],
              [103.8470613847388, 1.3889119307208715],
              [103.8470613847388, 1.3901119307208716],
              [103.8458613847388, 1.3901119307208716],
              [103.8458613847388, 1.3889119307208715],
            ],
          ],
        },
        whatDimension: 'what.infra.area',
        whereDimension: 'where.ste.digihub.l1',
        properties: {
          isSearchable: true,
        },
      };

      addMapObject(area);
      setMessage('✅ Area added successfully!');
      refreshList();
    } catch (error: any) {
      console.error('[CustomMapObjectTest] Error adding shop:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Remove first custom object
  const removeFirst = () => {
    if (customObjects.length === 0) {
      setMessage('❌ No custom objects to remove');
      return;
    }

    try {
      const firstId = customObjects[0].mapObjectId;
      removeMapObject(firstId);
      setMessage(`✅ Removed object: ${firstId}`);
      refreshList();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Update first custom object
  const updateFirst = () => {
    if (customObjects.length === 0) {
      setMessage('❌ No custom objects to update');
      return;
    }

    try {
      const firstId = customObjects[0].mapObjectId;
      updateMapObject(firstId, {
        name: `Updated ${customObjects[0].name}`,
        properties: {
          ...customObjects[0].properties,
          metadata: {
            ...customObjects[0].properties?.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      });
      setMessage(`✅ Updated object: ${firstId}`);
      refreshList();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Clear all custom objects
  const clearAll = () => {
    try {
      clearCustomMapObjects();
      setMessage('✅ All custom objects cleared');
      refreshList();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  if (!isReady) {
    return (
      <Card.Root>
        <Card.Body>
          <p>⏳ Waiting for SDK to be ready...</p>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root>
      <Card.Header title="Custom Map Objects" subtitle={`${customObjects.length} objects`} />
      <Card.Body>
        {message && (
          <div
            style={{
              padding: '10px',
              marginBottom: '15px',
              background: message.includes('✅') ? '#d4edda' : '#f8d7da',
              color: message.includes('✅') ? '#155724' : '#721c24',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {message}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Add Objects</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button variant="primary" size="small" onClick={addRestaurant}>
                Add Restaurant (Point)
              </Button>
              <Button variant="primary" size="small" onClick={addShop}>
                Add Shop (Custom Layers)
              </Button>
              <Button variant="primary" size="small" onClick={addPath}>
                Add Path (LineString)
              </Button>
              <Button variant="primary" size="small" onClick={addArea}>
                Add Area (Polygon)
              </Button>
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Manage</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button variant="outline" size="small" onClick={removeFirst}>
                Remove First
              </Button>
              <Button variant="outline" size="small" onClick={updateFirst}>
                Update First
              </Button>
              <Button variant="outline" size="small" onClick={clearAll}>
                Clear All
              </Button>
              <Button variant="outline" size="small" onClick={refreshList}>
                Refresh List
              </Button>
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
              Current Objects ({customObjects.length})
            </h4>
            {customObjects.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>No custom objects added yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {customObjects.map((obj) => (
                  <div
                    key={obj.mapObjectId}
                    style={{
                      padding: '10px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6',
                      fontSize: '12px',
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '4px' }}>{obj.name}</strong>
                    <div style={{ color: '#666' }}>
                      <div>ID: {obj.mapObjectId}</div>
                      <div>What: {obj.whatDimension}</div>
                      <div>Where: {obj.whereDimension}</div>
                      <div>Searchable: {obj.properties?.isSearchable ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card.Root>
  );
};
