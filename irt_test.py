import numpy as np

from girth import create_synthetic_irt_dichotomous
from girth import twopl_mml

# Create Synthetic Data
difficulty = np.linspace(-2.5, 2.5, 100)
discrimination = np.random.rand(100) + 0.5
theta = np.random.randn(500)


syn_data = create_synthetic_irt_dichotomous(difficulty, discrimination, theta)
print(syn_data)

# Solve for parameters
estimates = twopl_mml(syn_data)

# Unpack estimates
discrimination_estimates = estimates['Discrimination']
difficulty_estimates = estimates['Difficulty']

print(discrimination)
print(discrimination_estimates)

print(difficulty)
print(difficulty_estimates)