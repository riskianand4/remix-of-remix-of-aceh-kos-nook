function goDetail(type) {
  window.location.href = "detail.html?type=" + type;
}

// Chart
const ctx = document.getElementById('pieChart');
new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['Positif', 'Netral', 'Negatif'],
    datasets: [{
      data: [48, 43, 8],
      backgroundColor: ['#22c55e', '#64748b', '#ef4444']
    }]
  }
});
