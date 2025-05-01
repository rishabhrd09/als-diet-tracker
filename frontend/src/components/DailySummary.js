import React from 'react';
import './DailySummary.css'; // Create CSS

function DailySummary({ items }) {
    const totals = items.reduce((acc, item) => {
        acc.totalCalories += item.calories || 0;
        acc.totalProtein += parseFloat(item.protein_g || 0);
        acc.totalCarbs += parseFloat(item.carbs_g || 0);
        acc.totalFat += parseFloat(item.fat_g || 0);
        if (item.is_administered) {
            acc.consumedCalories += item.calories || 0;
            acc.consumedProtein += parseFloat(item.protein_g || 0);
            acc.consumedCarbs += parseFloat(item.carbs_g || 0);
            acc.consumedFat += parseFloat(item.fat_g || 0);
            acc.administeredFeeds += 1;
        }
        return acc;
    }, { 
        totalCalories: 0, consumedCalories: 0, 
        totalProtein: 0, consumedProtein: 0,
        totalCarbs: 0, consumedCarbs: 0,
        totalFat: 0, consumedFat: 0,
        administeredFeeds: 0 
    });

    const progressPercentage = totals.totalCalories > 0 
        ? ((totals.consumedCalories / totals.totalCalories) * 100).toFixed(0) 
        : 0;

    return (
        <div className="daily-summary">
            <h3>Today's Progress ({progressPercentage}%)</h3>
             <div className="summary-grid">
                <div className="summary-item">
                    <span>Calories</span>
                    <strong>{totals.consumedCalories.toFixed(0)} / {totals.totalCalories.toFixed(0)} kcal</strong>
                </div>
                 <div className="summary-item">
                    <span>Protein</span>
                    <strong>{totals.consumedProtein.toFixed(1)} / {totals.totalProtein.toFixed(1)} g</strong>
                </div>
                 <div className="summary-item">
                    <span>Carbs</span>
                    <strong>{totals.consumedCarbs.toFixed(1)} / {totals.totalCarbs.toFixed(1)} g</strong>
                </div>
                 <div className="summary-item">
                    <span>Fat</span>
                    <strong>{totals.consumedFat.toFixed(1)} / {totals.totalFat.toFixed(1)} g</strong>
                </div>
                 <div className="summary-item">
                    <span>Feeds Given</span>
                    <strong>{totals.administeredFeeds} / {items.length}</strong>
                </div>
            </div>
             {/* Optional: Progress Bar */}
             <div className="progress-bar-container">
                 <div 
                    className="progress-bar" 
                    style={{ width: `${progressPercentage}%` }}
                 ></div>
             </div>
        </div>
    );
}

export default DailySummary;