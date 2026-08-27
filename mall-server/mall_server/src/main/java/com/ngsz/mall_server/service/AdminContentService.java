package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.BrandMapper;
import com.ngsz.mall_server.mapper.CategoryMapper;
import com.ngsz.mall_server.mapper.CouponTemplateMapper;
import com.ngsz.mall_server.pojo.Brand;
import com.ngsz.mall_server.pojo.Category;
import com.ngsz.mall_server.pojo.CouponTemplate;
import com.ngsz.mall_server.pojo.dto.AdminBrandRequest;
import com.ngsz.mall_server.pojo.dto.AdminCategoryRequest;
import com.ngsz.mall_server.pojo.dto.AdminCouponRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;

@Service
public class AdminContentService {

    private final CouponTemplateMapper couponTemplateMapper;
    private final CategoryMapper categoryMapper;
    private final BrandMapper brandMapper;

    public AdminContentService(
            CouponTemplateMapper couponTemplateMapper,
            CategoryMapper categoryMapper,
            BrandMapper brandMapper) {
        this.couponTemplateMapper = couponTemplateMapper;
        this.categoryMapper = categoryMapper;
        this.brandMapper = brandMapper;
    }

    public PageResult<CouponTemplate> listCoupons(
            String keyword, Integer status, Integer page, Integer size) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeSize = size == null || size < 1 ? 20 : Math.min(size, 200);
        List<CouponTemplate> all = couponTemplateMapper.findByCondition(
                normalizeKeyword(keyword), normalizeOptionalStatus(status));
        int from = Math.min((safePage - 1) * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        return new PageResult<>((long) all.size(), all.subList(from, to), safePage, safeSize);
    }

    @Transactional
    public CouponTemplate createCoupon(AdminCouponRequest request) {
        validateCoupon(request);
        CouponTemplate coupon = new CouponTemplate();
        copyCoupon(request, coupon);
        coupon.setIssuedCount(0);
        coupon.setUsedCount(0);
        couponTemplateMapper.insert(coupon);
        return coupon;
    }

    @Transactional
    public void updateCoupon(Long id, AdminCouponRequest request) {
        validateCoupon(request);
        CouponTemplate coupon = requireCoupon(id);
        if (request.getTotalCount() < valueOrZero(coupon.getIssuedCount())) {
            throw new BusinessException("发行总量不能小于已领取数量");
        }
        copyCoupon(request, coupon);
        couponTemplateMapper.update(coupon);
    }

    @Transactional
    public void updateCouponStatus(Long id, Integer status) {
        validateStatus(status, "优惠券状态只能是 0 或 1");
        CouponTemplate coupon = requireCoupon(id);
        coupon.setStatus(status);
        couponTemplateMapper.update(coupon);
    }

    public List<Category> listCategories() {
        return categoryMapper.findAllForAdmin();
    }

    @Transactional
    public Category createCategory(AdminCategoryRequest request) {
        validateCategory(request);
        Category category = new Category();
        copyCategory(request, category);
        categoryMapper.insert(category);
        return category;
    }

    @Transactional
    public void updateCategory(Long id, AdminCategoryRequest request) {
        validateCategory(request);
        Category category = requireCategory(id);
        if (id.equals(request.getParentId())) {
            throw new BusinessException("分类不能将自己设为父分类");
        }
        copyCategory(request, category);
        categoryMapper.update(category);
    }

    @Transactional
    public void updateCategoryStatus(Long id, Integer status) {
        validateStatus(status, "分类状态只能是 0 或 1");
        Category category = requireCategory(id);
        category.setStatus(status);
        categoryMapper.update(category);
    }

    public List<Brand> listBrands() {
        return brandMapper.findAllForAdmin();
    }

    @Transactional
    public Brand createBrand(AdminBrandRequest request) {
        validateBrand(request);
        Brand brand = new Brand();
        copyBrand(request, brand);
        brandMapper.insert(brand);
        return brand;
    }

    @Transactional
    public void updateBrand(Long id, AdminBrandRequest request) {
        validateBrand(request);
        Brand brand = requireBrand(id);
        copyBrand(request, brand);
        brandMapper.update(brand);
    }

    @Transactional
    public void updateBrandStatus(Long id, Integer status) {
        validateStatus(status, "品牌状态只能是 0 或 1");
        Brand brand = requireBrand(id);
        brand.setStatus(status);
        brandMapper.update(brand);
    }

    private CouponTemplate requireCoupon(Long id) {
        CouponTemplate coupon = couponTemplateMapper.findById(id);
        if (coupon == null) {
            throw new BusinessException("优惠券不存在");
        }
        return coupon;
    }

    private Category requireCategory(Long id) {
        Category category = categoryMapper.findById(id);
        if (category == null) {
            throw new BusinessException("分类不存在");
        }
        return category;
    }

    private Brand requireBrand(Long id) {
        Brand brand = brandMapper.findById(id);
        if (brand == null) {
            throw new BusinessException("品牌不存在");
        }
        return brand;
    }

    private static void validateCoupon(AdminCouponRequest request) {
        if (request == null) {
            throw new BusinessException("优惠券信息不能为空");
        }
        if (request.getStartTime() == null || request.getEndTime() == null
                || !request.getEndTime().isAfter(request.getStartTime())) {
            throw new BusinessException("优惠券结束时间必须晚于开始时间");
        }
        LocalDateTime receiveStart = request.getReceiveStartTime() == null
                ? request.getStartTime() : request.getReceiveStartTime();
        LocalDateTime receiveEnd = request.getReceiveEndTime() == null
                ? request.getEndTime() : request.getReceiveEndTime();
        LocalDateTime useStart = request.getUseStartTime() == null
                ? request.getStartTime() : request.getUseStartTime();
        LocalDateTime useEnd = request.getUseEndTime() == null
                ? request.getEndTime() : request.getUseEndTime();
        if (!receiveEnd.isAfter(receiveStart) || !useEnd.isAfter(useStart)) {
            throw new BusinessException("领取和使用结束时间必须晚于开始时间");
        }
        if (request.getType() == 2 && request.getAmount().compareTo(new BigDecimal("100")) >= 0) {
            throw new BusinessException("折扣券折扣值必须小于 100");
        }
    }

    private static void validateCategory(AdminCategoryRequest request) {
        if (request == null) {
            throw new BusinessException("分类信息不能为空");
        }
        if (request.getParentId() == null || request.getParentId() < 0) {
            throw new BusinessException("父分类 ID 不正确");
        }
    }

    private static void validateBrand(AdminBrandRequest request) {
        if (request == null) {
            throw new BusinessException("品牌信息不能为空");
        }
    }

    private static void copyCoupon(AdminCouponRequest request, CouponTemplate coupon) {
        coupon.setShopId(request.getShopId());
        coupon.setName(request.getName() == null ? null : request.getName().trim());
        coupon.setType(request.getType());
        coupon.setAmount(request.getAmount());
        coupon.setMinAmount(request.getMinAmount());
        coupon.setTotalCount(request.getTotalCount());
        coupon.setStartTime(request.getStartTime());
        coupon.setEndTime(request.getEndTime());
        coupon.setReceiveStartTime(request.getReceiveStartTime());
        coupon.setReceiveEndTime(request.getReceiveEndTime());
        coupon.setUseStartTime(request.getUseStartTime());
        coupon.setUseEndTime(request.getUseEndTime());
        coupon.setPerUserLimit(request.getPerUserLimit() == null
                ? (coupon.getPerUserLimit() == null ? 1 : coupon.getPerUserLimit())
                : request.getPerUserLimit());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setStatus(request.getStatus());
    }

    private static void copyCategory(AdminCategoryRequest request, Category category) {
        category.setParentId(request.getParentId());
        category.setName(request.getName() == null ? null : request.getName().trim());
        category.setLevel(request.getLevel());
        category.setIcon(request.getIcon());
        category.setSortOrder(request.getSortOrder());
        category.setStatus(request.getStatus());
    }

    private static void copyBrand(AdminBrandRequest request, Brand brand) {
        brand.setName(request.getName() == null ? null : request.getName().trim());
        brand.setLogo(request.getLogo());
        brand.setDescription(request.getDescription());
        brand.setSortOrder(request.getSortOrder());
        brand.setStatus(request.getStatus());
    }

    private static Integer normalizeOptionalStatus(Integer status) {
        if (status == null) {
            return null;
        }
        validateStatus(status, "状态只能是 0 或 1");
        return status;
    }

    private static void validateStatus(Integer status, String message) {
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException(message);
        }
    }

    private static String normalizeKeyword(String keyword) {
        return keyword == null || keyword.isBlank() ? null : keyword.trim();
    }

    private static int valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }
}
