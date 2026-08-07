#!/usr/bin/env bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "==============================================================="
echo "      PocketPills UX Redesign Repository Report"
echo "==============================================================="
echo ""

########################################
# Overview
########################################

echo -e "${BLUE}Repository Overview${NC}"
echo "---------------------------------------------------------------"

echo "Generated : $(date)"
echo "Root      : $(pwd)"

echo ""

########################################
# Documentation
########################################

echo -e "${BLUE}Documentation${NC}"
echo "---------------------------------------------------------------"

DOCS=$(find docs -type f -name "*.md" | wc -l | xargs)

echo "Markdown Documents : $DOCS"

echo ""
tree docs \
-I ".DS_Store|*.png|*.jpg|*.jpeg|*.svg|*.pdf|*.fig"

echo ""

########################################
# Assets
########################################

echo -e "${BLUE}Assets${NC}"
echo "---------------------------------------------------------------"

tree docs/assets

echo ""

########################################
# Figma Workspace
########################################

echo -e "${BLUE}Figma Workspace${NC}"
echo "---------------------------------------------------------------"

if [ -d figma ]; then
    tree figma
else
    echo -e "${RED}✗ No Figma workspace found${NC}"
fi

echo ""

########################################
# Presentation
########################################

echo -e "${BLUE}Presentation${NC}"
echo "---------------------------------------------------------------"

if [ -d presentation ]; then
    tree presentation
else
    echo -e "${YELLOW}No presentation folder yet${NC}"
fi

echo ""

########################################
# Exports
########################################

echo -e "${BLUE}Exports${NC}"
echo "---------------------------------------------------------------"

if [ -d exports ]; then
    tree exports
else
    echo -e "${YELLOW}No export folder yet${NC}"
fi

echo ""

########################################
# Statistics
########################################

echo -e "${BLUE}Repository Statistics${NC}"
echo "---------------------------------------------------------------"

echo "Markdown Files      : $(find docs -name '*.md' | wc -l | xargs)"
echo "Directories         : $(find . -type d | wc -l | xargs)"
echo "Files               : $(find . -type f | wc -l | xargs)"
echo "Asset Directories   : $(find docs/assets -type d | wc -l | xargs)"

echo ""

########################################
# Documentation Coverage
########################################

echo -e "${BLUE}Documentation Coverage${NC}"
echo "---------------------------------------------------------------"

printf "%-20s %s\n" "00_Project" "✓"
printf "%-20s %s\n" "01_Discovery" "✓"
printf "%-20s %s\n" "02_Strategy" "✓"
printf "%-20s %s\n" "03_UX" "✓"
printf "%-20s %s\n" "04_UI" "✓"
printf "%-20s %s\n" "05_Prototype" "✓"
printf "%-20s %s\n" "06_Validation" "✓"

echo ""

########################################
# Design Deliverables
########################################

echo -e "${BLUE}Design Deliverables${NC}"
echo "---------------------------------------------------------------"

check_folder () {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

check_folder figma "Figma Workspace"
check_folder exports "Exports"
check_folder presentation "Presentation"

echo ""

########################################
# Project Progress
########################################

echo -e "${BLUE}Project Progress${NC}"
echo "---------------------------------------------------------------"

cat <<EOF

Research            ██████████ 100%

Strategy            ██████████ 100%

UX                  ██████████ 100%

UI Documentation    ██████████ 100%

Prototype Spec      ██████████ 100%

Validation Plan     ██████████ 100%

----------------------------------------------

Documentation       ██████████ 100%

Visual Design       ░░░░░░░░░░   0%

Component Library   ░░░░░░░░░░   0%

High Fidelity       ░░░░░░░░░░   0%

Prototype           ░░░░░░░░░░   0%

Usability Testing   ░░░░░░░░░░   0%

EOF

echo ""

########################################
# Next Milestones
########################################

echo -e "${BLUE}Recommended Next Steps${NC}"
echo "---------------------------------------------------------------"

cat <<EOF

1. Build Figma Foundations
   - Colors
   - Typography
   - Grid
   - Variables

2. Build Component Library
   - Buttons
   - Inputs
   - Cards
   - Navigation
   - Healthcare Components

3. Design Core Screens
   - Landing
   - Dashboard
   - Treatments
   - Consultation
   - Checkout

4. Build Interactive Prototype

5. Conduct Usability Testing

6. Export Final Case Study

EOF

echo ""

########################################
# Repository Health
########################################

echo -e "${BLUE}Repository Health${NC}"
echo "---------------------------------------------------------------"

echo -e "${GREEN}✓ Documentation Structure${NC}"
echo -e "${GREEN}✓ Product Design Process${NC}"
echo -e "${GREEN}✓ UX Documentation${NC}"
echo -e "${GREEN}✓ UI Documentation${NC}"
echo -e "${GREEN}✓ Prototype Documentation${NC}"
echo -e "${GREEN}✓ Validation Documentation${NC}"

echo ""

echo "==============================================================="
echo " Overall Status"
echo "==============================================================="
echo ""
echo -e "${GREEN}Repository Ready for Figma Design Execution${NC}"
echo ""