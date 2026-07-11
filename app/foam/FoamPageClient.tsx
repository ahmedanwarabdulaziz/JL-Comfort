'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
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
  Alert,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TuneIcon from '@mui/icons-material/Tune';
import ScienceIcon from '@mui/icons-material/Science';
import CircularProgress from '@mui/material/CircularProgress';
import DynamicSVG from '@/components/foam-shapes/DynamicSVG';
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

  const gradeBlurbs: Record<string, string> = {
    'Medium': 'A balanced, everyday feel and our most popular compression — great for standard seat cushions and general upholstery replacement.',
    'Medium Firm': 'A step up in support without losing comfort, built for cushions that see daily, heavy use.',
    'Firm': 'A dense, supportive core that holds its shape under sustained weight — a favourite for firmer seating.',
    'XX-Firm': 'Our densest compression, reserved for premium seating and mattress cores that demand maximum support.',
  };

  const thicknessRuleInfo = getRuleForDimension('thickness');
  const depthRuleInfo = getRuleForDimension('depth');
  const widthRuleInfo = getRuleForDimension('width');

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
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Hero Section */}
      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Custom Foam Replacement
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          Design your perfect cushion in two easy steps. Select a shape, enter your dimensions, and choose from our premium NeoGel High-Density foam — built to outlast conventional cushioning.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          
          {/* Main Content Area */}
          <Grid item xs={12} lg={8}>
            
            {/* Step 1: Shape Selection */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Step 1: Choose Your Shape</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Select the shape that best matches your project.</Typography>
                
                <Grid container spacing={4}>
                  {/* Left Sidebar: Categories */}
                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
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
                              py: 2,
                              '&.Mui-selected': {
                                bgcolor: '#000000',
                                color: '#e3c29a',
                                '&:hover': {
                                  bgcolor: '#1a1a1a',
                                },
                                '& .MuiListItemIcon-root': {
                                  color: '#e3c29a',
                                }
                              },
                              '&:hover': {
                                bgcolor: 'rgba(227, 194, 154, 0.1)',
                              }
                            }}
                          >
                            <ListItemText primary={category.name} primaryTypographyProps={{ fontWeight: selectedCategoryId === category.id ? 'bold' : 'normal' }} />
                            <ChevronRightIcon sx={{ color: selectedCategoryId === category.id ? '#e3c29a' : 'action.active' }} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  </Grid>

                  {/* Right Side: Foam Types Grid */}
                  <Grid item xs={12} md={8}>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress sx={{ color: '#e3c29a' }} />
                      </Box>
                    ) : foamTypes.length === 0 ? (
                      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
                        No foam shapes available for this category.
                      </Typography>
                    ) : (
                      <Grid container spacing={3}>
                        {foamTypes.map((type) => (
                          <Grid item xs={12} sm={6} key={type.id}>
                            <Card
                              elevation={selectedTypeId === type.id ? 4 : 0}
                              sx={{
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 3,
                                border: '2px solid',
                                borderColor: selectedTypeId === type.id ? '#e3c29a' : 'divider',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: 4,
                                  borderColor: '#e3c29a',
                                },
                              }}
                              onClick={() => handleTypeChange(type.id)}
                            >
                              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 160, bgcolor: '#ffffff' }}>
                                {type.imageUrl ? (
                                  <img src={type.imageUrl} alt={type.name} style={{ maxWidth: '100%', maxHeight: 140, objectFit: 'contain' }} />
                                ) : type.customSvgContent ? (
                                  <DynamicSVG svgContent={type.customSvgContent} dimensions={{}} />
                                ) : (
                                  <Typography variant="caption" color="text.secondary">No Image</Typography>
                                )}
                              </Box>
                              <Divider />
                              <CardContent sx={{ textAlign: 'center', py: 2, bgcolor: selectedTypeId === type.id ? 'rgba(227, 194, 154, 0.1)' : '#fafafa' }}>
                                <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 'bold' }}>
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
              </Box>
            )}

            {/* Step 2: Customization */}
            {activeStep === 1 && selectedType && (
              <Box>
                <Button 
                  startIcon={<ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />} 
                  onClick={handleBack}
                  sx={{ color: '#000', mb: 3, fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(227, 194, 154, 0.2)' } }}
                >
                  Back to Shapes
                </Button>
                
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Step 2: Customize Your Foam</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Enter dimensions and select your foam quality.</Typography>
                
                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
                  <Grid container spacing={6}>
                    {/* Shape Visualization */}
                    <Grid item xs={12} md={5}>
                      <Box sx={{ position: 'sticky', top: 24 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>{selectedType.name}</Typography>
                        {selectedType.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {selectedType.description}
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
                          borderColor: 'divider'
                        }}>
                          {(() => {
                            const shapeDimensions = selectedType.dimensions.reduce((acc, dim) => {
                              if (dim.letterShortcut) {
                                acc[dim.letterShortcut] = dimensions[dim.name] || 0;
                              }
                              return acc;
                            }, {} as Record<string, number>);

                            if (selectedType.customSvgContent) {
                              return <DynamicSVG svgContent={selectedType.customSvgContent} dimensions={shapeDimensions} />;
                            }
                            if (selectedType.imageUrl) {
                              return <img src={selectedType.imageUrl} alt={selectedType.name} style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'contain' }} />;
                            }
                            return <Typography color="text.secondary">No Image Available</Typography>;
                          })()}
                        </Box>
                      </Box>
                    </Grid>

                    {/* Configuration Options */}
                    <Grid item xs={12} md={7}>
                      
                      {/* Dimensions Input */}
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Dimensions (Inches)</Typography>
                      <Alert severity="info" icon={false} sx={{ mb: 3, bgcolor: 'rgba(227, 194, 154, 0.15)', color: '#000', border: '1px solid rgba(227, 194, 154, 0.6)', '& .MuiAlert-message': { width: '100%' } }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Measuring Tips</Typography>
                        <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
                          • Thickness is cut in whole inches{thicknessRuleInfo ? ` (${thicknessRuleInfo.minValue ?? 1}"–${thicknessRuleInfo.maxValue ?? 7}")` : ''}.<br />
                          • Depth and width are rounded up to our nearest standard foam block size, so your cushion always has enough material.<br />
                          • Pieces longer than {widthRuleInfo?.maxBlockLength ?? 81}&quot; are expertly seamed from two blocks — see &ldquo;Join Required&rdquo; in your order summary.
                        </Typography>
                      </Alert>
                      <Grid container spacing={3} sx={{ mb: 5 }}>
                        {selectedType.dimensions.map((dimension) => {
                          const rule = getRuleForDimension(dimension.type);
                          const minValue = rule?.minValue ?? 0;
                          const maxValue = rule?.maxValue;
                          const step = rule?.allowFractions !== false ? 0.1 : 1;
                          const currentValue = dimensions[dimension.name] || 0;
                          const warningMessage = validateDimensionValue(currentValue, dimension.type);
                          const hasError = warningMessage !== null;
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
                                  if (inputStr === '' || inputStr === '-') {
                                    handleDimensionChange(dimension.name, 0, dimension.type);
                                  } else {
                                    const inputValue = parseFloat(inputStr);
                                    if (!isNaN(inputValue)) {
                                      handleDimensionChange(dimension.name, inputValue, dimension.type);
                                    } else {
                                      handleDimensionChange(dimension.name, 0, dimension.type);
                                    }
                                  }
                                }}
                                inputProps={{ step, min: minValue, max: maxValue }}
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">in</InputAdornment>,
                                  sx: { borderRadius: 2, bgcolor: '#fff' }
                                }}
                                error={hasError}
                                helperText={warningMessage || ''}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>

                      <Divider sx={{ mb: 5 }} />

                      {/* Foam Grade Selection */}
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>Select Foam Grade</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        All grades below are our premium NeoGel High-Density foam, available in four precision compressions so you can match the exact feel your piece needs.
                      </Typography>
                      {foamGrades.length === 0 ? (
                        <Typography color="text.secondary">No foam grades available.</Typography>
                      ) : (
                        <Grid container spacing={2} sx={{ mb: 5 }}>
                          {foamGrades.map((grade) => (
                            <Grid item xs={12} sm={6} key={grade.id}>
                              <Card
                                onClick={() => setSelectedGradeId(grade.id)}
                                elevation={0}
                                sx={{
                                  cursor: 'pointer',
                                  borderRadius: 3,
                                  border: '2px solid',
                                  borderColor: selectedGradeId === grade.id ? '#e3c29a' : 'divider',
                                  bgcolor: selectedGradeId === grade.id ? 'rgba(227, 194, 154, 0.05)' : '#fff',
                                  transition: 'all 0.2s',
                                  height: '100%',
                                  '&:hover': {
                                    borderColor: '#e3c29a',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                  }
                                }}
                              >
                                <CardContent sx={{ p: 2.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                                        {grade.brand}
                                      </Typography>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#000' }}>
                                        {grade.gradeName}
                                      </Typography>
                                    </Box>
                                    <CheckCircleIcon sx={{ color: selectedGradeId === grade.id ? '#e3c29a' : 'transparent', transition: 'color 0.2s' }} />
                                  </Box>
                                  {grade.firmness && gradeBlurbs[grade.firmness] && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                      {gradeBlurbs[grade.firmness]}
                                    </Typography>
                                  )}
                                  <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                    {grade.density && (
                                      <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Density</Typography>
                                        <Typography variant="body2" fontWeight="medium">{grade.density}</Typography>
                                      </Box>
                                    )}
                                    {grade.firmness && (
                                      <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Firmness</Typography>
                                        <Typography variant="body2" fontWeight="medium">{grade.firmness}</Typography>
                                      </Box>
                                    )}
                                    {grade.warranty && (
                                      <Box sx={{ gridColumn: 'span 2' }}>
                                        <Typography variant="caption" color="text.secondary" display="block">Life Expectancy</Typography>
                                        <Typography variant="body2" fontWeight="medium">{grade.warranty}</Typography>
                                      </Box>
                                    )}
                                  </Box>
                                  <Divider sx={{ my: 2 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    ${grade.price.toFixed(2)} <Typography component="span" variant="caption" color="text.secondary">/ cu ft</Typography>
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      )}

                      <Divider sx={{ mb: 5 }} />

                      {/* Fibre Wrap */}
                      <Box sx={{ mb: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Dacron / Fibre Wrap</Typography>
                            <Typography variant="body2" color="text.secondary">Adds a rounded, plush look to your cushions.</Typography>
                          </Box>
                          <Switch
                            checked={wrapEnabled}
                            onChange={(e) => {
                              setWrapEnabled(e.target.checked);
                              if (!e.target.checked) setSelectedWrapId('');
                            }}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#e3c29a' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#e3c29a' } }}
                          />
                        </Box>
                        {wrapEnabled && (
                          <Grid container spacing={2}>
                            {fibreWraps.map((wrap) => (
                              <Grid item xs={12} sm={6} key={wrap.id}>
                                <Card
                                  onClick={() => setSelectedWrapId(wrap.id)}
                                  elevation={0}
                                  sx={{
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    border: '2px solid',
                                    borderColor: selectedWrapId === wrap.id ? '#000' : 'divider',
                                    bgcolor: selectedWrapId === wrap.id ? '#000' : '#fff',
                                    color: selectedWrapId === wrap.id ? '#fff' : '#000',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{wrap.fibreThickness}</Typography>
                                      {selectedWrapId === wrap.id && <CheckCircleIcon sx={{ color: '#e3c29a', fontSize: 20 }} />}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: selectedWrapId === wrap.id ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                                      +${wrap.value.toFixed(2)} / cu ft
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                      </Box>
                      
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
                {/* Decorative background accent */}
                <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(227, 194, 154, 0.1)', filter: 'blur(30px)' }} />
                
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, letterSpacing: 1 }}>
                  ORDER SUMMARY
                </Typography>
                
                {(() => {
                  if (activeStep === 0) {
                    return (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Please select a shape to begin your custom order.
                        </Typography>
                      </Box>
                    );
                  }

                  const result = calculateVolume();
                  if (result === null) {
                    return (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Enter all dimensions to see your live price.
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
                  
                  const depthRule = getRuleForDimension('depth');
                  const widthRule = getRuleForDimension('width');
                  const depthMaxBlockLength = depthRule?.maxBlockLength ?? 88;
                  const widthMaxBlockLength = widthRule?.maxBlockLength ?? 88;
                  const depthExceeds = result.rawDepth > depthMaxBlockLength;
                  const widthExceeds = result.rawWidth > widthMaxBlockLength;

                  return (
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      {/* Product Name & Dims */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e3c29a' }}>
                          {selectedType?.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', mt: 0.5 }}>
                          {result.thickness.toFixed(2)}&quot; H × {result.depth.toFixed(2)}&quot; D × {result.width.toFixed(2)}&quot; W
                        </Typography>
                      </Box>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                      {/* Calculations */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Total Volume</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{result.volume.toFixed(2)} cu ft</Typography>
                        </Box>
                        
                        {selectedGrade && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Box>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Foam Grade</Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                                {selectedGrade.gradeName} (@ ${selectedGrade.price.toFixed(2)}/cu ft)
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${foamPrice.toFixed(2)}</Typography>
                          </Box>
                        )}
                        
                        {wrapEnabled && selectedWrap && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Box>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Fibre Wrap</Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                                {selectedWrap.fibreThickness} (@ ${selectedWrap.value.toFixed(2)}/cu ft)
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${wrapPriceValue.toFixed(2)}</Typography>
                          </Box>
                        )}
                      </Box>

                      {(depthExceeds || widthExceeds) && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(227, 194, 154, 0.1)', borderRadius: 2, borderLeft: '4px solid #e3c29a' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e3c29a', mb: 0.5 }}>
                            ⚠ JOIN REQUIRED
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            Blocks are {Math.max(depthMaxBlockLength, widthMaxBlockLength)}&quot; long. Your foam will be expertly glued.
                          </Typography>
                        </Box>
                      )}

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                      {/* Totals */}
                      {unitTotal > 0 ? (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Unit Price</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${unitTotal.toFixed(2)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Quantity</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>× {quantity}</Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>TOTAL</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#e3c29a' }}>${orderTotal.toFixed(2)}</Typography>
                          </Box>

                          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.5)', mb: 1.5 }}>
                            🚚 Cut &amp; shipped within 3–5 business days
                          </Typography>
                          <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={handleAddToCart}
                            disabled={!selectedGradeId}
                            sx={{
                              bgcolor: '#e3c29a',
                              color: '#000',
                              py: 1.5,
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              '&:hover': {
                                bgcolor: '#d4b087',
                              },
                              '&.Mui-disabled': {
                                bgcolor: 'rgba(227, 194, 154, 0.3)',
                                color: 'rgba(0,0,0,0.5)',
                              }
                            }}
                          >
                            Add to Cart
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 2 }}>
                          Select a foam grade to view pricing.
                        </Typography>
                      )}
                    </Box>
                  );
                })()}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* NeoGel Education Section */}
      <Box sx={{ bgcolor: '#0a0a0a', color: '#fff', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" sx={{ color: '#e3c29a', letterSpacing: 2, fontWeight: 'bold' }}>
              WHY NEOGEL
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              Premium NeoGel High-Density Foam
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 720, mx: 'auto', color: 'rgba(255,255,255,0.7)' }}>
              Every cushion we cut is made from NeoGel, a high-density polyurethane foam engineered to hold its shape
              and support far longer than the lighter, conventional foam used in most off-the-shelf furniture.
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ mb: 6 }}>
            {[
              {
                icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
                title: 'Outlasts Conventional Foam',
                text: 'NeoGel resists height loss and firmness fade far better than standard polyurethane, so your cushions stay supportive for years, not months.',
              },
              {
                icon: <VerifiedIcon sx={{ fontSize: 32 }} />,
                title: 'Trusted by Reupholsterers',
                text: 'The same high-density grade used in high-end reupholstery workshops, offering serious performance without a premium markup.',
              },
              {
                icon: <TuneIcon sx={{ fontSize: 32 }} />,
                title: 'Four Precision Compressions',
                text: 'From a supportive Medium to a mattress-core-ready XX-Firm, dial in exactly the feel your project calls for.',
              },
              {
                icon: <ScienceIcon sx={{ fontSize: 32 }} />,
                title: 'Tested for Real-World Durability',
                text: 'Life expectancy is estimated using industry-standard flex-fatigue testing that repeatedly compresses each foam sample to measure long-term height and firmness retention.',
              },
            ].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.title}>
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Box sx={{ color: '#e3c29a', mb: 1.5 }}>{item.icon}</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{item.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>{item.text}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Grade Spec Table */}
          {foamGrades.length > 0 && (
            <Paper elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr 1.3fr' }, borderBottom: '1px solid rgba(255,255,255,0.1)', bgcolor: 'rgba(227, 194, 154, 0.08)' }}>
                {['Grade', 'Firmness', 'Density', 'Life Expectancy (Seat / Mattress)'].map((h) => (
                  <Box key={h} sx={{ p: 2, display: { xs: h === 'Grade' ? 'block' : 'none', md: 'block' } }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1, color: '#e3c29a', textTransform: 'uppercase' }}>{h}</Typography>
                  </Box>
                ))}
              </Box>
              {foamGrades.map((grade, idx) => (
                <Box
                  key={grade.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr 1.3fr' },
                    borderBottom: idx < foamGrades.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff' }}>{grade.gradeName}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: { xs: 'block', md: 'none' } }}>
                      {grade.firmness} · {grade.density} · {grade.warranty}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{grade.firmness || '—'}</Typography>
                  </Box>
                  <Box sx={{ p: 2, display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{grade.density || '—'}</Typography>
                  </Box>
                  <Box sx={{ p: 2, display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{grade.warranty || '—'}</Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'rgba(255,255,255,0.4)' }}>
            Life expectancy is a laboratory estimate based on repeated compression (flex-fatigue) testing. Actual results vary with body weight and use.
          </Typography>
        </Container>
      </Box>

      <CartDrawer />
    </Box>
  );
}
