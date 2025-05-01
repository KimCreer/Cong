import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const CARD_MARGIN = 12;
export const CARD_WIDTH = width - (CARD_MARGIN * 2);
export const AVATAR_SIZE = 40;
export const IMAGE_HEIGHT = 240;

const styles = StyleSheet.create({
  // Global Styles
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Styles
  searchContainer: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingVertical: 8,
    paddingRight: 8,
    paddingLeft: 24,
    fontSize: 14,
    color: '#212529',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
  },

  // Filter Styles
  filterWrapper: {
    position: 'relative',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterGradientRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
  },

  // Post Card Styles
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: CARD_MARGIN,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    borderRadius: AVATAR_SIZE / 2,
    padding: 2,
  },
  avatarImage: {
    backgroundColor: '#ffffff',
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212529',
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#868e96',
    marginRight: 4,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 6,
  },
  postText: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#f1f3f5',
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  imageError: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imageErrorText: {
    marginTop: 8,
    color: '#adb5bd',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkButton: {
    padding: 6,
    marginRight: 12,
  },
  categoryBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#495057',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 13,
    color: '#4a6da7',
    fontWeight: '500',
  },

  // List Styles
  listContent: {
    paddingBottom: 20,
  },
  loaderContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#868e96',
    fontSize: 14,
  },

  // Empty State Styles
  emptyContainer: {
    margin: 16,
    padding: 24,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#868e96',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#4a6da7',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Error State Styles
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff3f3',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorDetail: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6da7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  retryButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
  },
  cachedText: {
    color: '#868e96',
    marginTop: 8,
    fontSize: 12,
  },

  // Filter Item Styles
  filterItem: {
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterItemActive: {
    backgroundColor: '#4a6da7',
    borderColor: '#4a6da7',
    shadowColor: '#4a6da7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: -100,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 5, // To compensate for the back button
  },
});

export default styles;