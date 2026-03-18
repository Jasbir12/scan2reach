package com.scan2reachapp.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.scan2reachapp.R;
import com.scan2reachapp.models.CallHistory;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class CallHistoryAdapter extends RecyclerView.Adapter<CallHistoryAdapter.ViewHolder> {

    private Context context;
    private List<CallHistory> callHistoryList;
    private SimpleDateFormat dateFormat;

    public CallHistoryAdapter(Context context, List<CallHistory> callHistoryList) {
        this.context = context;
        this.callHistoryList = callHistoryList;
        this.dateFormat = new SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault());
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_call_history, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        CallHistory call = callHistoryList.get(position);

        // Caller name
        holder.tvCallerName.setText(call.getCallerName() != null ? call.getCallerName() : "Unknown");

        // Vehicle number or call type
        if (call.isEmergency()) {
            holder.tvVehicleNumber.setText("🚨 EMERGENCY");
            holder.tvVehicleNumber.setTextColor(context.getResources().getColor(R.color.error));
        } else {
            holder.tvVehicleNumber.setText(call.getVehicleNumber() != null ? call.getVehicleNumber() : "Unknown Vehicle");
            holder.tvVehicleNumber.setTextColor(context.getResources().getColor(R.color.text_secondary));
        }

        // Date/Time
        if (call.getTimestamp() != null) {
            holder.tvDateTime.setText(dateFormat.format(call.getTimestamp().toDate()));
        }

        // Duration
        holder.tvDuration.setText(call.getFormattedDuration());

        // Status icon
        holder.tvStatus.setText(call.getStatusIcon());
    }

    @Override
    public int getItemCount() {
        return callHistoryList.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvCallerName, tvVehicleNumber, tvDateTime, tvDuration, tvStatus;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvCallerName = itemView.findViewById(R.id.tvCallerName);
            tvVehicleNumber = itemView.findViewById(R.id.tvVehicleNumber);
            tvDateTime = itemView.findViewById(R.id.tvDateTime);
            tvDuration = itemView.findViewById(R.id.tvDuration);
            tvStatus = itemView.findViewById(R.id.tvStatus);
        }
    }
}