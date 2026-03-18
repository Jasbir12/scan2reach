package com.scan2reachapp.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.scan2reachapp.R;
import com.scan2reachapp.models.Profile;

import java.util.List;

public class ProfileAdapter extends RecyclerView.Adapter<ProfileAdapter.ViewHolder> {

    private Context context;
    private List<Profile> profileList;

    public ProfileAdapter(Context context, List<Profile> profileList) {
        this.context = context;
        this.profileList = profileList;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_profile, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Profile profile = profileList.get(position);

        // Profile type icon
        String icon = "vehicle".equals(profile.getProductType()) ? "🚗" : "👤";
        holder.tvIcon.setText(icon);

        // Display name
        holder.tvName.setText(profile.getDisplayName());

        // Type
        String type = "vehicle".equals(profile.getProductType()) ? "Vehicle" : "Business Card";
        holder.tvType.setText(type);

        // Status
        if (profile.isSubscriptionActive()) {
            holder.tvStatus.setText("✓ Active");
            holder.tvStatus.setTextColor(context.getResources().getColor(R.color.success));
        } else {
            holder.tvStatus.setText("✗ Expired");
            holder.tvStatus.setTextColor(context.getResources().getColor(R.color.error));
        }

        // Views count
        holder.tvViews.setText(profile.getViews() + " views");
    }

    @Override
    public int getItemCount() {
        return profileList.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvIcon, tvName, tvType, tvStatus, tvViews;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvIcon = itemView.findViewById(R.id.tvIcon);
            tvName = itemView.findViewById(R.id.tvName);
            tvType = itemView.findViewById(R.id.tvType);
            tvStatus = itemView.findViewById(R.id.tvStatus);
            tvViews = itemView.findViewById(R.id.tvViews);
        }
    }
}