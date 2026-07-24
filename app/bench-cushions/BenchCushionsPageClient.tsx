'use client';

import { useState } from 'react';
import {
  Typography,
  Button,
  Container,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Paper,
  Divider,
  InputAdornment,
  Chip,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCart } from '@/lib/context/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import { BenchCushionStyle, CushionVariableOption } from '@/lib/types/benchCushion';
import { FabricItem } from '@/lib/types/fabric';
import { FabricPriceTier } from '@/lib/types/fabricPriceTier';
import FabricGalleryStep from '@/components/bench-cushions/FabricGalleryStep';

interface BenchCushionsPageClientProps {
  styles: BenchCushionStyle[];
}

export default function BenchCushionsPageClient({ styles }: BenchCushionsPageClientProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, CushionVariableOption>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedFabric, setSelectedFabric] = useState<FabricItem | null>(null);
  const [selectedFabricTier, setSelectedFabricTier] = useState<FabricPriceTier | null>(null);

  const selectedStyle = styles.find((s) => s.id === selectedStyleId) || null;
  const primaryImage = selectedStyle?.images?.[0] || null;

  const handleSelectStyle = (style: BenchCushionStyle) => {
    setSelectedStyleId(style.id);

    const initialDimensions: Record<string, number> = {};
    style.dimensions.forEach((dim) => {
      initialDimensions[dim.name] = dim.value;
    });
    setDimensions(initialDimensions);
    setSelectedOptions({});
    setQuantity(1);
    setSelectedFabric(null);
    setSelectedFabricTier(null);
    setActiveStep(1);
  };

  const handleSelectFabric = (fabric: FabricItem | null, tier: FabricPriceTier | null) => {
    setSelectedFabric(fabric);
    setSelectedFabricTier(fabric ? tier : null);
  };

  const handleBackToStyles = () => {
    setActiveStep(0);
  };

  const handleBackToCustomize = () => {
    setActiveStep(1);
  };

  const handleContinueToFabric = () => {
    if (allGroupsSelected) setActiveStep(2);
  };

  const handleDimensionChange = (name: string, value: number) => {
    setDimensions((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionSelect = (variableName: string, option: CushionVariableOption) => {
    setSelectedOptions((prev) => ({ ...prev, [variableName]: option }));
  };

  const allGroupsSelected =
    !!selectedStyle &&
    selectedStyle.variables.every(
      (v) => v.options.length === 0 || !!selectedOptions[v.name]
    );

  const optionsTotal = Object.values(selectedOptions).reduce(
    (sum, opt) => sum + (opt.priceModifier || 0),
    0
  );
  const estimatedYards = selectedStyle?.estimatedYards || 0;
  const fabricCost =
    selectedFabric && selectedFabricTier ? estimatedYards * selectedFabricTier.pricePerYard : 0;
  const unitPrice = (selectedStyle?.basePrice || 0) + optionsTotal + fabricCost;
  const orderTotal = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!selectedStyle || !allGroupsSelected) return;

    addToCart({
      productType: 'benchCushion',
      cushionStyleId: selectedStyle.id,
      cushionStyleName: selectedStyle.name,
      cushionDimensions: dimensions,
      cushionOptions: Object.entries(selectedOptions).map(([groupName, option]) => ({
        groupName,
        choiceLabel: option.label,
        priceModifier: option.priceModifier,
        imageUrl: option.imageUrl,
      })),
      fabric: selectedFabric
        ? {
            id: selectedFabric.id,
            name: selectedFabric.name,
            imageUrl: selectedFabric.imageUrl,
            source: selectedFabric.source,
            productUrl: selectedFabric.productUrl,
            tierName: selectedFabricTier?.name,
            pricePerYard: selectedFabricTier?.pricePerYard,
            estimatedYards,
            cost: fabricCost,
          }
        : undefined,
      quantity,
      unitPrice,
      totalPrice: orderTotal,
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Hero Section */}
      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Custom Bench Cushions
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          Design your perfect bench cushion in three easy steps. Choose a style, enter your dimensions and options, then browse fabrics to complete the look.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {/* Main Content Area */}
          <Grid item xs={12} lg={8}>
            {/* Step 1: Style Selection */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Step 1: Choose Your Style
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Select the cushion style that best matches your project.
                </Typography>

                {styles.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
                    No bench cushion styles available yet.
                  </Typography>
                ) : (
                  <Grid container spacing={3}>
                    {styles.map((style) => (
                      <Grid item xs={12} sm={6} key={style.id}>
                        <Card
                          elevation={selectedStyleId === style.id ? 4 : 0}
                          sx={{
                            cursor: 'pointer',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 3,
                            border: '2px solid',
                            borderColor: selectedStyleId === style.id ? '#e3c29a' : 'divider',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                              borderColor: '#e3c29a',
                            },
                          }}
                          onClick={() => handleSelectStyle(style)}
                        >
                          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 160, bgcolor: '#ffffff' }}>
                            {style.images?.[0] ? (
                              <img src={style.images[0]} alt={style.name} style={{ maxWidth: '100%', maxHeight: 140, objectFit: 'contain' }} />
                            ) : (
                              <Typography variant="caption" color="text.secondary">No Image</Typography>
                            )}
                          </Box>
                          <Divider />
                          <CardContent sx={{ textAlign: 'center', py: 2, bgcolor: selectedStyleId === style.id ? 'rgba(227, 194, 154, 0.1)' : '#fafafa' }}>
                            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 'bold' }}>
                              {style.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              From ${style.basePrice.toFixed(2)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Step 2: Customization */}
            {activeStep === 1 && selectedStyle && (
              <Box>
                <Button
                  startIcon={<ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />}
                  onClick={handleBackToStyles}
                  sx={{ color: '#000', mb: 3, fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(227, 194, 154, 0.2)' } }}
                >
                  Back to Styles
                </Button>

                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Step 2: Customize Your Cushion
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Enter dimensions and select your style options.
                </Typography>

                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
                  <Grid container spacing={6}>
                    {/* Style Visualization */}
                    <Grid item xs={12} md={5}>
                      <Box sx={{ position: 'sticky', top: 24 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>{selectedStyle.name}</Typography>
                        {selectedStyle.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {selectedStyle.description}
                          </Typography>
                        )}
                        <Box sx={{
                          p: 4,
                          bgcolor: '#f8f9fa',
                          borderRadius: 3,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}>
                          {primaryImage ? (
                            <img src={primaryImage} alt={selectedStyle.name} style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'contain' }} />
                          ) : (
                            <Typography color="text.secondary">No Image Available</Typography>
                          )}
                        </Box>
                        {selectedStyle.images.length > 1 && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                            {selectedStyle.images.slice(1).map((img) => (
                              <Box
                                key={img}
                                sx={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: '#fff',
                                }}
                              >
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* Configuration Options */}
                    <Grid item xs={12} md={7}>
                      {/* Dimensions Input */}
                      {selectedStyle.dimensions.length > 0 && (
                        <>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Dimensions (Inches)</Typography>
                          <Grid container spacing={3} sx={{ mb: 5 }}>
                            {selectedStyle.dimensions.map((dimension) => {
                              const shortcutLetter = dimension.letterShortcut?.trim().toUpperCase() || null;
                              return (
                                <Grid item xs={12} sm={6} key={dimension.name}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#000' }}>
                                      {dimension.name}
                                    </Typography>
                                    {shortcutLetter && (
                                      <Chip
                                        label={shortcutLetter}
                                        size="small"
                                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold', bgcolor: '#000', color: '#e3c29a' }}
                                      />
                                    )}
                                  </Box>
                                  <TextField
                                    type="number"
                                    fullWidth
                                    placeholder="0.0"
                                    value={dimensions[dimension.name] ?? ''}
                                    onChange={(e) => {
                                      const inputStr = e.target.value;
                                      const inputValue = inputStr === '' || inputStr === '-' ? 0 : parseFloat(inputStr);
                                      handleDimensionChange(dimension.name, isNaN(inputValue) ? 0 : inputValue);
                                    }}
                                    inputProps={{ step: 0.1, min: 0 }}
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">in</InputAdornment>,
                                      sx: { borderRadius: 2, bgcolor: '#fff' },
                                    }}
                                  />
                                </Grid>
                              );
                            })}
                          </Grid>
                          <Divider sx={{ mb: 5 }} />
                        </>
                      )}

                      {/* Style Options */}
                      {selectedStyle.variables.map((variable) => (
                        <Box key={variable.name} sx={{ mb: 5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>{variable.name}</Typography>
                          <Grid container spacing={2}>
                            {variable.options.map((option) => {
                              const isSelected = selectedOptions[variable.name]?.label === option.label;
                              return (
                                <Grid item xs={12} sm={6} key={option.label}>
                                  <Card
                                    onClick={() => handleOptionSelect(variable.name, option)}
                                    elevation={0}
                                    sx={{
                                      cursor: 'pointer',
                                      borderRadius: 3,
                                      border: '2px solid',
                                      borderColor: isSelected ? '#e3c29a' : 'divider',
                                      bgcolor: isSelected ? 'rgba(227, 194, 154, 0.05)' : '#fff',
                                      transition: 'all 0.2s',
                                      height: '100%',
                                      '&:hover': {
                                        borderColor: '#e3c29a',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                      },
                                    }}
                                  >
                                    <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      {option.imageUrl && (
                                        <Box sx={{ width: 44, height: 44, borderRadius: 1, overflow: 'hidden', flexShrink: 0, border: '1px solid', borderColor: 'divider' }}>
                                          <img src={option.imageUrl} alt={option.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </Box>
                                      )}
                                      <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{option.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {option.priceModifier > 0
                                            ? `+$${option.priceModifier.toFixed(2)}`
                                            : option.priceModifier < 0
                                            ? `-$${Math.abs(option.priceModifier).toFixed(2)}`
                                            : 'Included'}
                                        </Typography>
                                      </Box>
                                      <CheckCircleIcon sx={{ color: isSelected ? '#e3c29a' : 'transparent', transition: 'color 0.2s' }} />
                                    </CardContent>
                                  </Card>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      ))}

                      {/* Quantity */}
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Quantity</Typography>
                        <TextField
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(Math.max(1, val));
                          }}
                          inputProps={{ min: 1, step: 1 }}
                          sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}

            {/* Step 3: Fabric Selection */}
            {activeStep === 2 && selectedStyle && (
              <Box>
                <Button
                  startIcon={<ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />}
                  onClick={handleBackToCustomize}
                  sx={{ color: '#000', mb: 3, fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(227, 194, 154, 0.2)' } }}
                >
                  Back to Customize
                </Button>

                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Step 3: Choose Your Fabric
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Browse fabric options, or skip and add to cart without one.
                </Typography>

                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
                  <FabricGalleryStep
                    selectedFabric={selectedFabric}
                    onSelect={handleSelectFabric}
                    estimatedYards={estimatedYards}
                  />
                </Paper>
              </Box>
            )}
          </Grid>

          {/* Right Column: Order Summary (Sticky) */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Paper
                elevation={6}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: '#000000',
                  color: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(227, 194, 154, 0.1)', filter: 'blur(30px)' }} />

                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, letterSpacing: 1 }}>
                  ORDER SUMMARY
                </Typography>

                {activeStep === 0 || !selectedStyle ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Please select a style to begin your custom order.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e3c29a' }}>
                        {selectedStyle.name}
                      </Typography>
                      {Object.keys(dimensions).length > 0 && (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                          {Object.entries(dimensions).map(([name, val]) => `${name}: ${val}"`).join(' × ')}
                        </Typography>
                      )}
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Base Price</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${selectedStyle.basePrice.toFixed(2)}</Typography>
                      </Box>
                      {Object.entries(selectedOptions).map(([groupName, option]) => (
                        <Box key={groupName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 1 }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" noWrap sx={{ color: 'rgba(255,255,255,0.7)' }}>{groupName}</Typography>
                            <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                              {option.label}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
                            {option.priceModifier >= 0 ? '+' : '-'}${Math.abs(option.priceModifier).toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                      {selectedFabric && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 1 }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" noWrap sx={{ color: 'rgba(255,255,255,0.7)' }}>Fabric</Typography>
                            <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                              {selectedFabric.name}
                              {selectedFabricTier ? ` (${selectedFabricTier.name}, ${estimatedYards} yd)` : ''}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', flexShrink: 0 }}>+${fabricCost.toFixed(2)}</Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Unit Price</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${unitPrice.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Quantity</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>× {quantity}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>TOTAL</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#e3c29a' }}>${orderTotal.toFixed(2)}</Typography>
                      </Box>

                      {!allGroupsSelected && selectedStyle.variables.length > 0 && (
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.6)', mb: 1.5 }}>
                          Select an option from every group above to continue.
                        </Typography>
                      )}

                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={activeStep === 2 ? handleAddToCart : handleContinueToFabric}
                        disabled={!allGroupsSelected}
                        sx={{
                          bgcolor: '#e3c29a',
                          color: '#000',
                          py: 1.5,
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          '&:hover': { bgcolor: '#d4b087' },
                          '&.Mui-disabled': {
                            bgcolor: 'rgba(227, 194, 154, 0.3)',
                            color: 'rgba(0,0,0,0.5)',
                          },
                        }}
                      >
                        {activeStep === 2 ? 'Add to Cart' : 'Continue to Fabric'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <CartDrawer />
    </Box>
  );
}
