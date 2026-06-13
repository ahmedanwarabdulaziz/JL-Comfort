'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Paper,
  Divider,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import CircularProgress from '@mui/material/CircularProgress';
import DynamicSVG from '@/components/foam-shapes/DynamicSVG';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import { Category } from '@/lib/types/category';
import { FoamType, FoamDimension, DimensionType } from '@/lib/types/foam';
import { getFoamTypes } from '@/lib/data/foam';
import { getDimensionRules, calculateRoundedValue } from '@/lib/data/dimension-rules';
import { DimensionRule } from '@/lib/types/dimension-rules';
import { getFibreWraps } from '@/lib/data/fibre-wrap';
import { FibreWrap } from '@/lib/types/fibre-wrap';
import { getFoamGrades } from '@/lib/data/foam-grades';
import { FoamGrade } from '@/lib/types/foam-grade';

interface FoamPageClientProps {
  categories: Category[];
}

export default function FoamPageClient({ categories }: FoamPageClientProps) {
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [foamTypes, setFoamTypes] = useState<FoamType[]>([]);
  const [selectedType, setSelectedType] = useState<FoamType | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [dimensionRules, setDimensionRules] = useState<DimensionRule[]>([]);
  const [fibreWraps, setFibreWraps] = useState<FibreWrap[]>([]);
  const [selectedWrapId, setSelectedWrapId] = useState<string>('');
  const [wrapEnabled, setWrapEnabled] = useState<boolean>(false);
  const [foamGrades, setFoamGrades] = useState<FoamGrade[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Fetch dimension rules and fibre wraps on component mount
  useEffect(() => {
    getDimensionRules()
      .then((rules) => {
        setDimensionRules(rules);
      })
      .catch((error) => {
        console.error('Error fetching dimension rules:', error);
      });

    getFibreWraps()
      .then((wraps) => {
        setFibreWraps(wraps);
      })
      .catch((error) => {
        console.error('Error fetching fibre wraps:', error);
      });

    getFoamGrades()
      .then((grades) => {
        console.log('Fetched foam grades:', grades);
        console.log('Number of grades:', grades?.length || 0);
        setFoamGrades(grades || []);
      })
      .catch((error) => {
        console.error('Error fetching foam grades:', error);
        setFoamGrades([]);
      });
  }, []);

  // Fetch foam types when category is selected
  useEffect(() => {
    if (selectedCategoryId) {
      setLoading(true);
      getFoamTypes(selectedCategoryId)
        .then((types) => {
          setFoamTypes(types);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching foam types:', error);
          setLoading(false);
        });
    } else {
      setFoamTypes([]);
      setSelectedTypeId('');
      setSelectedType(null);
    }
  }, [selectedCategoryId]);

  // Update selected type and dimensions when type is selected
  useEffect(() => {
    if (selectedTypeId && foamTypes.length > 0) {
      const type = foamTypes.find((t) => t.id === selectedTypeId);
      if (type) {
        setSelectedType(type);
        // Initialize dimensions with default values from the type (no auto-fixing)
        const initialDimensions: Record<string, number> = {};
        type.dimensions.forEach((dim) => {
          initialDimensions[dim.name] = dim.value;
        });
        setDimensions(initialDimensions);
      }
    } else {
      setSelectedType(null);
      setDimensions({});
    }
  }, [selectedTypeId, foamTypes]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      handleCategoryChange(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedTypeId('');
    setSelectedType(null);
    setDimensions({});
    setSelectedWrapId('');
    setWrapEnabled(false);
    setSelectedGradeId('');
    setQuantity(1);
    // Do not change activeStep here since Category & Type are on step 0
  };

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
    setActiveStep(1);
  };

  const getRuleForDimension = (dimensionType: DimensionType): DimensionRule | null => {
    return dimensionRules.find((rule) => rule.dimensionType === dimensionType) || null;
  };

  const handleDimensionChange = (dimensionName: string, value: number, dimensionType: DimensionType) => {
    // Don't auto-fix, just store the value as entered
    console.log('handleDimensionChange called:', { dimensionName, value, dimensionType });
    setDimensions((prev) => {
      const newDimensions = {
        ...prev,
        [dimensionName]: value,
      };
      console.log('Updated dimensions:', newDimensions);
      return newDimensions;
    });
  };

  const validateDimensionValue = (value: number, dimensionType: DimensionType): string | null => {
    const rule = getRuleForDimension(dimensionType);
    if (!rule) return null;

    const warnings: string[] = [];

    // Check min/max constraints
    if (rule.minValue !== undefined && value < rule.minValue) {
      warnings.push(`Minimum value is ${rule.minValue} inch`);
    }
    if (rule.maxValue !== undefined && value > rule.maxValue) {
      warnings.push(`Maximum value is ${rule.maxValue} inch`);
    }

    // Check fraction rule
    if (!rule.allowFractions && value % 1 !== 0) {
      warnings.push('Fractions are not allowed. Please enter a whole number.');
    }

    return warnings.length > 0 ? warnings.join('. ') : null;
  };

  const calculateVolume = () => {
    if (!selectedType) {
      return null;
    }

    // Group dimensions by type and find max value for each type using user-entered values
    const thicknessValues: number[] = [];
    const depthValues: number[] = [];
    const widthValues: number[] = [];

    selectedType.dimensions.forEach((dim) => {
      // Get the actual user-entered value from the dimensions state
      // Try exact match first, then case-insensitive match
      let userValue = dimensions[dim.name];
      if (userValue === undefined) {
        // Try case-insensitive match
        const matchingKey = Object.keys(dimensions).find(
          key => key.toLowerCase() === dim.name.toLowerCase()
        );
        if (matchingKey) {
          userValue = dimensions[matchingKey];
        }
      }
      
      console.log(`Checking dimension: name="${dim.name}", type="${dim.type}", userValue=${userValue}, all keys:`, Object.keys(dimensions));
      
      // Include if it's a valid number greater than 0
      if (userValue !== undefined && userValue !== null && !isNaN(userValue) && userValue > 0) {
        console.log(`Processing dimension: type="${dim.type}", value=${userValue}, type check:`, {
          isThickness: dim.type === 'thickness',
          isDepth: dim.type === 'depth',
          isWidth: dim.type === 'width',
        });
        
        // Normalize type for comparison (handle case and whitespace)
        const normalizedType = String(dim.type).toLowerCase().trim();
        
        // Handle both 'depth' and 'length' as depth (some types use 'length' instead of 'depth')
        if (normalizedType === 'thickness') {
          thicknessValues.push(userValue);
          console.log(`Added to thicknessValues: ${userValue}`);
        } else if (normalizedType === 'depth' || normalizedType === 'length') {
          depthValues.push(userValue);
          console.log(`Added to depthValues: ${userValue} (type: ${dim.type}, normalized: ${normalizedType})`);
        } else if (normalizedType === 'width') {
          widthValues.push(userValue);
          console.log(`Added to widthValues: ${userValue}`);
        } else {
          console.warn(`Unknown dimension type: "${dim.type}" (normalized: "${normalizedType}") for dimension "${dim.name}"`);
        }
      } else {
        console.log(`Skipping dimension "${dim.name}": userValue=${userValue}, valid=${userValue !== undefined && userValue !== null && !isNaN(userValue) && userValue > 0}`);
      }
    });

    console.log('Dimensions state:', dimensions);
    console.log('Selected type dimensions:', selectedType.dimensions);

    // Get max value for each type (use 0 if no values found)
    const maxThickness = thicknessValues.length > 0 ? Math.max(...thicknessValues) : 0;
    const maxDepth = depthValues.length > 0 ? Math.max(...depthValues) : 0;
    const maxWidth = widthValues.length > 0 ? Math.max(...widthValues) : 0;

    console.log('Calculation debug:', {
      dimensions,
      thicknessValues,
      depthValues,
      widthValues,
      maxThickness,
      maxDepth,
      maxWidth,
    });

    // If any dimension is missing (0), return null to show "enter dimensions" message
    if (maxThickness === 0 || maxDepth === 0 || maxWidth === 0) {
      return null;
    }

    // Apply rounding rules
    const thicknessRule = getRuleForDimension('thickness');
    const depthRule = getRuleForDimension('depth');
    const widthRule = getRuleForDimension('width');

    const roundedThickness = calculateRoundedValue(maxThickness, thicknessRule);
    const roundedDepth = calculateRoundedValue(maxDepth, depthRule);
    const roundedWidth = calculateRoundedValue(maxWidth, widthRule);

    // Calculate: (Thickness × Depth × Width) / 144
    const volume = (roundedThickness * roundedDepth * roundedWidth) / 144;
    
    // Calculate total price: volume × grade price (if grade is selected)
    const selectedGrade = foamGrades.find((g) => g.id === selectedGradeId);
    const totalPrice = selectedGrade ? volume * selectedGrade.price : null;
    
    // Calculate wrap price: wrap value × volume
    // If wrap is enabled: calculate price (or 0 if no wrap selected)
    // If wrap is disabled: show 0
    let wrapPrice: number | null = null;
    if (wrapEnabled) {
      const selectedWrap = selectedWrapId ? fibreWraps.find((w) => w.id === selectedWrapId) : null;
      wrapPrice = selectedWrap ? selectedWrap.value * volume : 0;
    } else {
      wrapPrice = 0;
    }
    
    return {
      volume,
      totalPrice,
      wrapPrice,
      thickness: roundedThickness,
      depth: roundedDepth,
      width: roundedWidth,
      rawDepth: maxDepth,
      rawWidth: maxWidth,
    };
  };

  const handleAddToCart = () => {
    const result = calculateVolume();
    if (!result || !selectedType || !selectedCategoryId || !selectedGradeId) return;

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const selectedGrade = foamGrades.find(g => g.id === selectedGradeId);
    const selectedWrap = wrapEnabled && selectedWrapId ? fibreWraps.find(w => w.id === selectedWrapId) : null;
    
    const foamPrice = result.totalPrice || 0;
    const wrapPriceValue = result.wrapPrice || 0;
    const unitTotal = foamPrice + wrapPriceValue;
    const orderTotal = unitTotal * quantity;

    addToCart({
      categoryId: selectedCategoryId,
      categoryName: selectedCategory?.name || '',
      typeId: selectedType.id,
      typeName: selectedType.name,
      dimensions: {
        thickness: result.thickness,
        depth: result.depth,
        width: result.width,
        rawDepth: result.rawDepth,
        rawWidth: result.rawWidth,
      },
      gradeId: selectedGrade?.id,
      gradeName: selectedGrade ? `${selectedGrade.brand} - ${selectedGrade.gradeName}` : undefined,
      wrapId: selectedWrap?.id,
      wrapName: selectedWrap?.fibreThickness,
      quantity,
      unitPrice: unitTotal,
      totalPrice: orderTotal,
    });
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedTypeId) {
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const steps = ['Choose Shape', 'Enter Dimensions'];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            JL Comfort
          </Typography>
          <Button color="inherit" component={Link} href="/">
            Home
          </Button>
          <Button color="inherit" component={Link} href="/admin">
            Admin
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Foam
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select your foam category, type, and dimensions
          </Typography>
        </Box>

        {/* Step 1: Shape Selection (Combined Categories & Types) */}
        {activeStep === 0 && (
          <Grid container spacing={4}>
            {/* Left Sidebar: Categories */}
            <Grid item xs={12} md={3}>
              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    Categories
                  </Typography>
                </Box>
                <List disablePadding>
                  {categories.map((category) => (
                    <ListItemButton
                      key={category.id}
                      selected={selectedCategoryId === category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'white',
                          }
                        },
                      }}
                    >
                      <ListItemText primary={category.name} />
                      <ChevronRightIcon sx={{ color: selectedCategoryId === category.id ? 'white' : 'action.active' }} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Right Side: Foam Types Grid */}
            <Grid item xs={12} md={9}>
              {loading ? (
                <Typography>Loading shapes...</Typography>
              ) : foamTypes.length === 0 ? (
                <Typography color="text.secondary">
                  No foam shapes available for this category.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {foamTypes.map((type) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={type.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          border: selectedTypeId === type.id ? 2 : 1,
                          borderColor:
                            selectedTypeId === type.id
                              ? 'primary.main'
                              : 'divider',
                          '&:hover': {
                            boxShadow: 3,
                          },
                        }}
                        onClick={() => handleTypeChange(type.id)}
                      >
                        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, minHeight: 120 }}>
                          {type.imageUrl ? (
                            <img src={type.imageUrl} alt={type.name} style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">No Image</Typography>
                          )}
                        </Box>
                        <Divider />
                        <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 'bold' }}>
                            {type.name}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </Grid>
        )}

        {/* Step 2: Dimensions Input */}
        {activeStep === 1 && selectedType && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Enter Dimensions
              </Typography>
              <Grid container spacing={4}>
                {/* Left Column: Product Info */}
                <Grid item xs={12} md={5}>
                  <Box sx={{ position: 'sticky', top: 20 }}>
                    <Card variant="outlined">
                      {(() => {
                        const shapeDimensions = selectedType.dimensions.reduce((acc, dim) => {
                          if (dim.letterShortcut) {
                            acc[dim.letterShortcut] = dimensions[dim.name] || 0;
                          }
                          return acc;
                        }, {} as Record<string, number>);

                        if (selectedType.customSvgContent) {
                          return (
                            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', backgroundColor: 'grey.50' }}>
                              <DynamicSVG svgContent={selectedType.customSvgContent} dimensions={shapeDimensions} />
                            </Box>
                          );
                        }

                        if (selectedType.imageUrl) {
                          return (
                            <CardMedia
                              component="img"
                              image={selectedType.imageUrl}
                              alt={selectedType.name}
                              sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: 400,
                                objectFit: 'contain',
                              }}
                            />
                          );
                        }

                        return (
                          <CardMedia
                            component="div"
                            sx={{
                              height: 300,
                              backgroundColor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography color="text.secondary">
                              No Image Available
                            </Typography>
                          </CardMedia>
                        );
                      })()}
                      <CardContent>
                        <Typography variant="h4" component="h2" gutterBottom>
                          {selectedType.name}
                        </Typography>
                        {selectedType.description && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                              {selectedType.description}
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>

                {/* Middle Column: Dimensions */}
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                      Customize Dimensions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {selectedType.dimensions.map((dimension, index) => {
                        const rule = getRuleForDimension(dimension.type);
                        const minValue = rule?.minValue ?? 0;
                        const maxValue = rule?.maxValue;
                        const allowFractions = rule?.allowFractions ?? true;
                        const step = allowFractions ? 0.1 : 1;
                        const currentValue = dimensions[dimension.name] || 0;
                        const warningMessage = validateDimensionValue(currentValue, dimension.type);
                        const hasError = warningMessage !== null;
                        
                        // Get the letter shortcut if assigned in admin
                        const shortcutLetter = dimension.letterShortcut?.trim().toUpperCase() || null;

                        return (
                          <Box key={dimension.name}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {dimension.name}
                              </Typography>
                              {shortcutLetter && (
                                <Chip 
                                  label={shortcutLetter} 
                                  size="small" 
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    backgroundColor: 'primary.light',
                                    color: 'primary.dark'
                                  }} 
                                />
                              )}
                            </Box>
                            <TextField
                              type="number"
                              placeholder={dimension.name}
                              value={dimensions[dimension.name] ?? ''}
                              onChange={(e) => {
                                const inputStr = e.target.value;
                                console.log('TextField onChange:', { name: dimension.name, inputStr });
                                
                                if (inputStr === '' || inputStr === '-') {
                                  // Store 0 for empty fields
                                  handleDimensionChange(dimension.name, 0, dimension.type);
                                } else {
                                  const inputValue = parseFloat(inputStr);
                                  if (!isNaN(inputValue)) {
                                    handleDimensionChange(dimension.name, inputValue, dimension.type);
                                  } else {
                                    // Invalid input, store 0
                                    handleDimensionChange(dimension.name, 0, dimension.type);
                                  }
                                }
                              }}
                              inputProps={{
                                step,
                                min: minValue,
                                max: maxValue,
                              }}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <Typography variant="body2" color="text.secondary">
                                      Inch
                                    </Typography>
                                  </InputAdornment>
                                ),
                              }}
                              error={hasError}
                              helperText={warningMessage || ''}
                              sx={{
                                width: 250,
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Wrap Selection */}
                    <Box sx={{ mt: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                          Select Wrap
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={wrapEnabled}
                              onChange={(e) => {
                                setWrapEnabled(e.target.checked);
                                if (!e.target.checked) {
                                  setSelectedWrapId('');
                                }
                              }}
                            />
                          }
                          label={wrapEnabled ? 'Wrap Enabled' : 'Wrap Disabled'}
                        />
                      </Box>
                      {wrapEnabled && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          {fibreWraps.map((wrap) => (
                            <Tooltip key={wrap.id} title={wrap.fibreThickness} arrow>
                              <Chip
                                icon={
                                  selectedWrapId === wrap.id ? (
                                    <CheckCircleIcon />
                                  ) : (
                                    <CircleIcon />
                                  )
                                }
                                label={wrap.fibreThickness}
                                onClick={() => setSelectedWrapId(wrap.id)}
                                color={selectedWrapId === wrap.id ? 'primary' : 'default'}
                                variant={selectedWrapId === wrap.id ? 'filled' : 'outlined'}
                                sx={{
                                  cursor: 'pointer',
                                  '&:hover': {
                                    boxShadow: 2,
                                  },
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      )}
                    </Box>

                    {/* Grade Selection */}
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Select Grade
                      </Typography>
                      {foamGrades.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No foam grades available. Please add grades in the admin panel.
                        </Typography>
                      ) : (
                        <FormControl sx={{ width: 250 }}>
                          <InputLabel id="grade-select-label">Foam Grade</InputLabel>
                          <Select
                            labelId="grade-select-label"
                            id="grade-select"
                            value={selectedGradeId}
                            label="Foam Grade"
                            onChange={(e) => setSelectedGradeId(e.target.value)}
                          >
                            {foamGrades.map((grade) => (
                              <MenuItem key={grade.id} value={grade.id}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <span>{grade.brand} - {grade.gradeName}</span>
                                  <span style={{ marginLeft: '16px', color: 'text.secondary' }}>
                                    ${grade.price.toFixed(2)}
                                  </span>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Box>

                    {/* Quantity Selection */}
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Quantity
                      </Typography>
                      <TextField
                        type="number"
                        label="Quantity"
                        value={quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setQuantity(Math.max(1, value));
                        }}
                        inputProps={{
                          min: 1,
                          step: 1,
                        }}
                        sx={{ width: 250 }}
                      />
                    </Box>

                  </Box>
                </Grid>

                {/* Right Column: Receipt-style Calculations */}
                <Grid item xs={12} md={3}>
                  <Box sx={{ position: 'sticky', top: 20 }}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 3,
                        bgcolor: '#ffffff',
                        border: '2px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        fontFamily: 'monospace',
                      }}
                    >
                      {(() => {
                        const result = calculateVolume();
                        console.log('Display render - result:', result);
                        if (result === null) {
                          return (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                                ORDER SUMMARY
                              </Typography>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="body2" color="text.secondary">
                                Please enter all dimensions to calculate
                              </Typography>
                            </Box>
                          );
                        }
                        
                        const foamPrice = result.totalPrice || 0;
                        const wrapPriceValue = result.wrapPrice || 0;
                        const unitTotal = foamPrice + wrapPriceValue;
                        const orderTotal = unitTotal * quantity;
                        const selectedGrade = foamGrades.find((g) => g.id === selectedGradeId);
                        const selectedWrap = selectedWrapId ? fibreWraps.find((w) => w.id === selectedWrapId) : null;
                        
                        // Check if depth or width exceeds max block length
                        const depthRule = getRuleForDimension('depth');
                        const widthRule = getRuleForDimension('width');
                        const depthMaxBlockLength = depthRule?.maxBlockLength ?? 88;
                        const widthMaxBlockLength = widthRule?.maxBlockLength ?? 88;
                        const depthExceeds = result.rawDepth > depthMaxBlockLength;
                        const widthExceeds = result.rawWidth > widthMaxBlockLength;
                        
                        return (
                          <Box>
                            {/* Receipt Header */}
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1, mb: 0.5 }}>
                                JL COMFORT
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                ORDER SUMMARY
                              </Typography>
                              <Divider sx={{ my: 2 }} />
                            </Box>

                            {/* Product Info */}
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {selectedType.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {result.thickness.toFixed(2)}&quot; × {result.depth.toFixed(2)}&quot; × {result.width.toFixed(2)}&quot;
                              </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Volume */}
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Volume:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {result.volume.toFixed(2)} cu ft
                                </Typography>
                              </Box>
                            </Box>

                            {/* Grade */}
                            {selectedGrade && (
                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Grade:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {selectedGrade.brand} {selectedGrade.gradeName}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    @ ${selectedGrade.price.toFixed(2)}/cu ft
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    ${foamPrice.toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            )}

                            {/* Wrap */}
                            {wrapEnabled && selectedWrap && (
                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Wrap:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {selectedWrap.fibreThickness}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    @ ${selectedWrap.value.toFixed(2)}/cu ft
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    ${wrapPriceValue.toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            )}

                            {/* Join Warning */}
                            {(depthExceeds || widthExceeds) && (
                              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'warning.dark', display: 'block', mb: 0.5 }}>
                                  ⚠ JOIN REQUIRED
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  Blocks are {Math.max(depthMaxBlockLength, widthMaxBlockLength)}&quot; long
                                </Typography>
                              </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Totals */}
                            {unitTotal > 0 ? (
                              <>
                                <Box sx={{ mb: 1.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Unit Total:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      ${unitTotal.toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Quantity:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      × {quantity}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Divider sx={{ my: 2, borderWidth: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    TOTAL:
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    ${orderTotal.toFixed(2)}
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              <Box sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Select grade to see pricing
                                </Typography>
                              </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Footer */}
                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                Thank you for your order
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })()}
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleAddToCart}
                  disabled={calculateVolume() === null || !selectedGradeId}
                >
                  Add to Cart
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
      <CartDrawer />
    </>
  );
}
